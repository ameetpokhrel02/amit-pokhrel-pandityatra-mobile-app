/**
 * useAlbumScreenshot
 * ------------------
 * Saves screenshots to a dedicated "PanditYatra" album in the
 * device's photo library. Handles album creation/lookup, edge
 * cases, and surfaces human-readable errors.
 *
 * Requires expo-media-library ≥ 16.x
 */

import { useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

const ALBUM_NAME = 'PanditYatra';

export interface SaveResult {
  success: boolean;
  assetUri?: string;
  albumId?: string;
  error?: string;
}

export function useAlbumScreenshot() {
  /** Cache the album reference so we don't look it up every time */
  const albumRef = useRef<MediaLibrary.Album | null>(null);

  // ─────────────────────────────────────────────────
  // 1. Ensure the PanditYatra album exists
  // ─────────────────────────────────────────────────

  const ensureAlbum = useCallback(
    async (firstAsset: MediaLibrary.Asset): Promise<MediaLibrary.Album | null> => {
      // Re-use cached album if still valid
      if (albumRef.current) {
        try {
          // Re-validate that the album still exists on disk
          const fresh = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
          if (fresh) {
            albumRef.current = fresh;
            return fresh;
          }
        } catch {
          albumRef.current = null;
        }
      }

      // Try to find an existing album with our name
      try {
        const existing = await MediaLibrary.getAlbumAsync(ALBUM_NAME);

        if (existing) {
          albumRef.current = existing;
          return existing;
        }
      } catch (err) {
        console.warn('[Album] Failed to lookup existing album:', err);
      }

      // Album doesn't exist – create it.
      // On Android, createAlbumAsync requires a first asset to be added
      // simultaneously; we pass our freshly saved asset here.
      try {
        const created = await MediaLibrary.createAlbumAsync(
          ALBUM_NAME,
          firstAsset,
          false // do NOT copy asset; it's already saved to the default camera roll
        );

        if (created) {
          albumRef.current = created;
          console.info(`[Album] Created new album: "${ALBUM_NAME}" (id: ${created.id})`);
          return created;
        }
      } catch (err: any) {
        // On some Android devices createAlbumAsync can fail if the asset
        // already belongs to the album. Non-fatal – just continue.
        console.warn('[Album] Could not create album, continuing without it:', err?.message);
      }

      return null;
    },
    []
  );

  // ─────────────────────────────────────────────────
  // 2. Save a file URI to the PanditYatra album
  // ─────────────────────────────────────────────────

  const saveToAlbum = useCallback(
    async (fileUri: string): Promise<SaveResult> => {
      // Step 1 – Verify permissions are already granted (caller must ensure this)
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Media library permission is not granted.',
        };
      }

      let asset: MediaLibrary.Asset | undefined;

      // Step 2 – Save the file to the default "Camera Roll" first.
      // This is required on both platforms before adding to an album.
      try {
        asset = await MediaLibrary.createAssetAsync(fileUri);
      } catch (err: any) {
        const msg = `Failed to save screenshot to library: ${err?.message ?? 'Unknown error'}`;
        console.error('[Album]', msg);
        return { success: false, error: msg };
      }

      // Step 3 – Ensure our album exists, then add the asset
      let albumId: string | undefined;
      try {
        const album = await ensureAlbum(asset);

        if (album) {
          // On iOS the asset is already in the album after createAlbumAsync
          // (if we just created it), but we still call addAssetsToAlbumAsync
          // when the album already existed.
          if (album.assetCount > 0 || Platform.OS === 'ios') {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          albumId = album.id;
        }
      } catch (err: any) {
        // Adding to album failed – asset is still in the camera roll, so we
        // treat this as a soft-warning, not a hard failure.
        console.warn('[Album] Could not add asset to album:', err?.message);
      }

      return {
        success: true,
        assetUri: asset.uri,
        albumId,
      };
    },
    [ensureAlbum]
  );

  // ─────────────────────────────────────────────────
  // 3. Convenience: save + show a user-friendly alert
  // ─────────────────────────────────────────────────

  const saveWithFeedback = useCallback(
    async (
      fileUri: string,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        silent?: boolean;
      }
    ): Promise<SaveResult> => {
      const result = await saveToAlbum(fileUri);

      if (options?.silent) return result;

      if (result.success) {
        Alert.alert(
          'Screenshot Saved!',
          options?.successMessage ??
            `Your screenshot has been saved to the "${ALBUM_NAME}" album in your photo library.`,
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'Save Failed',
          options?.errorMessage ??
            result.error ??
            'We were unable to save your screenshot. Please check your media permissions.',
          [{ text: 'OK' }]
        );
      }

      return result;
    },
    [saveToAlbum]
  );

  // ─────────────────────────────────────────────────
  // 4. Get album info (useful for display purposes)
  // ─────────────────────────────────────────────────

  const getAlbumInfo = useCallback(async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      return album;
    } catch {
      return null;
    }
  }, []);

  return {
    saveToAlbum,
    saveWithFeedback,
    getAlbumInfo,
    albumName: ALBUM_NAME,
  };
}
