import React from 'react';
import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import {
  captureViewToBase64Image,
  captureViewToImageFile,
  createPdfFromCapturedImageAsync,
  getCompressedCaptureOptions,
  getMediaPermissionState,
  getScreenshotPermissionAsync,
  openAppSettings,
  PANDITYATRA_SCREENSHOT_ALBUM,
  requestScreenshotPermissionAsync,
  saveImageToPanditYatraAlbumAsync,
  type ScreenshotCaptureOptions,
  type ScreenshotPermissionState,
  type ScreenshotPdfOptions,
  type ScreenshotSaveResult,
} from '@/utils/screenshotUtils';

export interface ScreenshotHookOptions {
  albumName?: string;
}

export interface CaptureAndSaveOptions extends ScreenshotCaptureOptions {
  silent?: boolean;
  compressed?: boolean;
}

export interface CapturePdfOptions extends ScreenshotPdfOptions, ScreenshotCaptureOptions {
  silent?: boolean;
}

export interface UseScreenshotResult {
  loading: boolean;
  permissionStatus: ScreenshotPermissionState;
  permissionResponse: MediaLibrary.PermissionResponse | null;
  checkPermission: () => Promise<ScreenshotPermissionState>;
  requestPermission: () => Promise<ScreenshotPermissionState>;
  captureAndSave: (
    viewRef: React.RefObject<any>,
    options?: CaptureAndSaveOptions
  ) => Promise<ScreenshotSaveResult | null>;
  captureAndSaveUri: (
    viewRef: React.RefObject<any>,
    options?: CaptureAndSaveOptions
  ) => Promise<string | null>;
  captureAndExportPdf: (
    viewRef: React.RefObject<any>,
    options?: CapturePdfOptions
  ) => Promise<string | null>;
}

/**
 * Screenshot hook for PanditYatra.
 *
 * Important isolation rule:
 * This hook only talks to expo-media-library for saving screenshots. It does not
 * use expo-image-picker, camera permissions, Google Auth scopes, WebRTC, or
 * location permissions, so those native flows remain independent.
 */
export function useScreenshot(options: ScreenshotHookOptions = {}): UseScreenshotResult {
  const albumName = options.albumName ?? PANDITYATRA_SCREENSHOT_ALBUM;
  const [loading, setLoading] = React.useState(false);
  const [permissionResponse, setPermissionResponse] =
    React.useState<MediaLibrary.PermissionResponse | null>(null);

  const permissionStatus = React.useMemo(
    () => getMediaPermissionState(permissionResponse),
    [permissionResponse]
  );

  const showPermissionDialog = React.useCallback((status: ScreenshotPermissionState) => {
    const message =
      status === 'blocked'
        ? 'Photos access is turned off for PanditYatra. Please open Settings and allow Photos access so screenshots can be saved to your PanditYatra album.'
        : 'PanditYatra needs permission to save booking confirmations, invoices, and Kundali chart screenshots to your PanditYatra album.';

    Alert.alert('Photos Permission Required', message, [
      { text: 'Not Now', style: 'cancel' },
      ...(status === 'blocked' ? [{ text: 'Open Settings', onPress: openAppSettings }] : []),
    ]);
  }, []);

  const checkPermission = React.useCallback(async (): Promise<ScreenshotPermissionState> => {
    if (Platform.OS === 'web') {
      setPermissionResponse(null);
      return 'unavailable';
    }

    const response = await getScreenshotPermissionAsync();
    setPermissionResponse(response);
    return getMediaPermissionState(response);
  }, []);

  const requestPermission = React.useCallback(async (): Promise<ScreenshotPermissionState> => {
    if (Platform.OS === 'web') return 'unavailable';

    const existing = await getScreenshotPermissionAsync();
    const existingStatus = getMediaPermissionState(existing);
    setPermissionResponse(existing);

    if (existingStatus === 'granted' || existingStatus === 'limited') {
      return existingStatus;
    }

    if (existingStatus === 'blocked') {
      return 'blocked';
    }

    const requested = await requestScreenshotPermissionAsync();
    setPermissionResponse(requested);
    return getMediaPermissionState(requested);
  }, []);

  const ensureCanSave = React.useCallback(
    async (silent?: boolean): Promise<boolean> => {
      const status = await requestPermission();

      if (status === 'granted' || status === 'limited') {
        return true;
      }

      if (!silent) {
        showPermissionDialog(status);
      }

      return false;
    },
    [requestPermission, showPermissionDialog]
  );

  const captureAndSave = React.useCallback(
    async (
      viewRef: React.RefObject<any>,
      captureOptions: CaptureAndSaveOptions = {}
    ): Promise<ScreenshotSaveResult | null> => {
      setLoading(true);

      try {
        const canSave = await ensureCanSave(captureOptions.silent);
        if (!canSave) return null;

        const imageOptions = captureOptions.compressed
          ? { ...getCompressedCaptureOptions(captureOptions.quality), ...captureOptions }
          : captureOptions;

        const fileUri = await captureViewToImageFile(viewRef, imageOptions);
        const result = await saveImageToPanditYatraAlbumAsync(fileUri, albumName);

        if (!captureOptions.silent) {
          Alert.alert('Screenshot Saved', `Saved to your "${albumName}" album.`);
        }

        return result;
      } catch (error: any) {
        console.warn('[useScreenshot] captureAndSave failed:', error);
        if (!captureOptions.silent) {
          Alert.alert(
            'Screenshot Failed',
            getFriendlyScreenshotError(error)
          );
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [albumName, ensureCanSave]
  );

  const captureAndSaveUri = React.useCallback(
    async (
      viewRef: React.RefObject<any>,
      captureOptions?: CaptureAndSaveOptions
    ): Promise<string | null> => {
      const result = await captureAndSave(viewRef, captureOptions);
      return result?.asset.uri ?? result?.fileUri ?? null;
    },
    [captureAndSave]
  );

  const captureAndExportPdf = React.useCallback(
    async (
      viewRef: React.RefObject<any>,
      pdfOptions: CapturePdfOptions = {}
    ): Promise<string | null> => {
      setLoading(true);

      try {
        const base64Image = await captureViewToBase64Image(viewRef, {
          ...getCompressedCaptureOptions(pdfOptions.quality ?? 0.9),
          ...pdfOptions,
        });
        const pdfUri = await createPdfFromCapturedImageAsync(base64Image, pdfOptions);

        if (!pdfOptions.silent) {
          Alert.alert('PDF Ready', 'Your Kundali PDF has been created and is ready to share.');
        }

        return pdfUri;
      } catch (error: any) {
        console.warn('[useScreenshot] captureAndExportPdf failed:', error);
        if (!pdfOptions.silent) {
          Alert.alert('PDF Export Failed', getFriendlyScreenshotError(error));
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    checkPermission().catch((error) => {
      console.warn('[useScreenshot] initial permission check failed:', error);
    });
  }, [checkPermission]);

  return {
    loading,
    permissionStatus,
    permissionResponse,
    checkPermission,
    requestPermission,
    captureAndSave,
    captureAndSaveUri,
    captureAndExportPdf,
  };
}

function getFriendlyScreenshotError(error: any): string {
  const message = String(error?.message ?? error ?? '').toLowerCase();

  if (message.includes('permission')) {
    return 'PanditYatra does not have permission to save this screenshot. Please allow Photos access and try again.';
  }

  if (message.includes('view') || message.includes('ref') || message.includes('snapshot')) {
    return 'The screen is still preparing. Please wait a moment and try again.';
  }

  if (message.includes('space') || message.includes('storage')) {
    return 'Your device may be low on storage. Please free some space and try again.';
  }

  return 'Unable to capture or save this screenshot right now. Please try again.';
}
