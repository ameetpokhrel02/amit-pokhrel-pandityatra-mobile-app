import { useState, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { captureRef as captureViewRef } from 'react-native-view-shot';

const ALBUM_NAME = 'PanditYatra';

export interface UseScreenshotResult {
  captureAndSave: (viewRef: React.RefObject<any>, options?: { silent?: boolean }) => Promise<string | null>;
  permissionResponse: ImagePicker.PermissionResponse | null;
  requestPermission: () => Promise<ImagePicker.PermissionResponse>;
  loading: boolean;
}

export function useScreenshot(): UseScreenshotResult {
  const [permissionResponse, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [loading, setLoading] = useState(false);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() =>
      Alert.alert('Error', 'Unable to open Settings automatically.')
    );
  }, []);

  const ensureAlbum = async (firstAsset: MediaLibrary.Asset): Promise<MediaLibrary.Album | null> => {
    try {
      // 1. Get permissions for MediaLibrary itself (required for write/album operations)
      const mediaLibPerm = await MediaLibrary.getPermissionsAsync();
      if (!mediaLibPerm.granted) {
        const req = await MediaLibrary.requestPermissionsAsync();
        if (!req.granted) {
          throw new Error('Media Library permission denied for saving.');
        }
      }

      // 2. Check if the album exists
      const existing = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (existing) {
        return existing;
      }

      // 3. Create the album with the first asset
      const created = await MediaLibrary.createAlbumAsync(ALBUM_NAME, firstAsset, false);
      return created;
    } catch (err: any) {
      console.warn('[useScreenshot] Album check/creation warning:', err?.message || err);
      return null;
    }
  };

  const captureAndSave = useCallback(
    async (viewRef: React.RefObject<any>, options?: { silent?: boolean }): Promise<string | null> => {
      if (!viewRef.current) {
        if (!options?.silent) {
          Alert.alert('Error', 'Ref to view is not ready.');
        }
        return null;
      }

      setLoading(true);
      try {
        // 1. Check and request permission using ImagePicker's hook state
        let currentPermission = permissionResponse;
        if (!currentPermission) {
          // Fallback check
          currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        }

        if (!currentPermission.granted) {
          const req = await requestPermission();
          if (!req.granted) {
            setLoading(false);
            if (!options?.silent) {
              Alert.alert(
                'Permission Required',
                'PanditYatra needs photos permission to save screenshots to your gallery.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: openSettings },
                ]
              );
            }
            return null;
          }
        }

        // 2. Capture the view
        const fileUri = await captureViewRef(viewRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });

        if (!fileUri) {
          throw new Error('Capture returned null/empty URI.');
        }

        // 3. Create the asset in photo library
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        if (!asset) {
          throw new Error('Failed to create media asset from screenshot.');
        }

        // 4. Try putting it in our specific "PanditYatra" album
        const album = await ensureAlbum(asset);
        if (album) {
          // On iOS the asset is added to the album on creation if created new,
          // but if it already existed we need to add it.
          // On Android we should add it if the album already existed as well.
          try {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } catch (addErr) {
            console.warn('[useScreenshot] Failed to add asset to album, asset is still in gallery.', addErr);
          }
        }

        setLoading(false);
        if (!options?.silent) {
          Alert.alert(
            'Screenshot Saved',
            `Successfully saved to your "${ALBUM_NAME}" album!`,
            [{ text: 'OK' }]
          );
        }
        return asset.uri;
      } catch (err: any) {
        console.error('[useScreenshot] Error during capture & save:', err);
        setLoading(false);
        if (!options?.silent) {
          Alert.alert(
            'Save Failed',
            err?.message || 'Unable to capture or save screenshot. Please try again.'
          );
        }
        return null;
      }
    },
    [permissionResponse, requestPermission, openSettings]
  );

  return {
    captureAndSave,
    permissionResponse,
    requestPermission,
    loading,
  };
}
