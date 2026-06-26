import { Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export const PANDITYATRA_SCREENSHOT_ALBUM = 'PanditYatra';

export type ScreenshotPermissionState =
  | 'granted'
  | 'limited'
  | 'denied'
  | 'blocked'
  | 'unavailable'
  | 'undetermined';

export interface ScreenshotCaptureOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
}

export interface ScreenshotSaveResult {
  asset: MediaLibrary.Asset;
  album: MediaLibrary.Album | null;
  fileUri: string;
}

export interface ScreenshotPdfOptions {
  title?: string;
  subtitle?: string;
  filePrefix?: string;
}

const DEFAULT_CAPTURE_OPTIONS: Required<Pick<ScreenshotCaptureOptions, 'format' | 'quality'>> = {
  format: 'png',
  quality: 0.96,
};

/**
 * Builds a stable timestamp that is safe for Android/iOS filenames.
 */
export function createScreenshotTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * Creates predictable filenames for screenshots/PDFs so user exports are easy to identify.
 */
export function createScreenshotFileName(prefix = 'pandityatra-screenshot', extension = 'png'): string {
  const cleanPrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'pandityatra-screenshot';

  return `${cleanPrefix}-${createScreenshotTimestamp()}.${extension.replace('.', '')}`;
}

/**
 * Converts Expo MediaLibrary responses into a smaller app-specific state.
 */
export function getMediaPermissionState(
  response: MediaLibrary.PermissionResponse | null | undefined
): ScreenshotPermissionState {
  if (!response) return 'undetermined';
  if (response.granted) {
    const accessPrivileges = (response as any).accessPrivileges;
    return accessPrivileges === 'limited' ? 'limited' : 'granted';
  }
  if (response.status === 'undetermined') return 'undetermined';
  return response.canAskAgain === false ? 'blocked' : 'denied';
}

/**
 * Opens the OS settings page for permanent denials.
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert('Settings unavailable', 'Please open your device settings and allow Photos access for PanditYatra.');
  }
}

/**
 * Checks the save-only media permission. This keeps screenshots isolated from
 * Google Auth, profile image picking, camera, video calling, and location flows.
 */
export async function getScreenshotPermissionAsync(): Promise<MediaLibrary.PermissionResponse> {
  return MediaLibrary.getPermissionsAsync(true);
}

/**
 * Requests save-only media permission. On Android 13+ this maps to the modern
 * image/media permission surface while older Android builds use external storage.
 */
export async function requestScreenshotPermissionAsync(): Promise<MediaLibrary.PermissionResponse> {
  return MediaLibrary.requestPermissionsAsync(true, ['photo']);
}

/**
 * Captures a mounted React Native view to a temporary image file.
 * `collapsable={false}` must be set on the captured View on Android.
 */
export async function captureViewToImageFile(
  viewRef: React.RefObject<any>,
  options: ScreenshotCaptureOptions = {}
): Promise<string> {
  if (!viewRef.current) {
    throw new Error('The view is not ready yet. Please wait a moment and try again.');
  }

  const format = options.format ?? DEFAULT_CAPTURE_OPTIONS.format;
  const quality = options.quality ?? DEFAULT_CAPTURE_OPTIONS.quality;

  return captureRef(viewRef, {
    format,
    quality,
    result: 'tmpfile',
    width: options.width,
    height: options.height,
  });
}

/**
 * Captures a view as a base64 JPEG. This is useful for embedding the Kundali
 * chart inside a generated PDF without touching the media-library permission.
 */
export async function captureViewToBase64Image(
  viewRef: React.RefObject<any>,
  options: ScreenshotCaptureOptions = {}
): Promise<string> {
  if (!viewRef.current) {
    throw new Error('The view is not ready yet. Please wait a moment and try again.');
  }

  return captureRef(viewRef, {
    format: options.format ?? 'jpg',
    quality: options.quality ?? 0.92,
    result: 'base64',
    width: options.width,
    height: options.height,
  });
}

/**
 * Compression helper for captures. Without adding another native dependency,
 * compression is handled by capturing JPEG at a lower quality.
 */
export function getCompressedCaptureOptions(quality = 0.82): ScreenshotCaptureOptions {
  return {
    format: 'jpg',
    quality: Math.min(Math.max(quality, 0.1), 1),
  };
}

/**
 * Finds or creates the PanditYatra album and stores the asset in it.
 */
export async function ensurePanditYatraAlbumAsync(
  firstAsset: MediaLibrary.Asset,
  albumName = PANDITYATRA_SCREENSHOT_ALBUM
): Promise<MediaLibrary.Album | null> {
  if (Platform.OS === 'web') return null;

  const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);
  if (existingAlbum) {
    await MediaLibrary.addAssetsToAlbumAsync([firstAsset], existingAlbum, false);
    return existingAlbum;
  }

  return MediaLibrary.createAlbumAsync(albumName, firstAsset, false);
}

/**
 * Saves an image file to the device photo library and PanditYatra album.
 */
export async function saveImageToPanditYatraAlbumAsync(
  fileUri: string,
  albumName = PANDITYATRA_SCREENSHOT_ALBUM
): Promise<ScreenshotSaveResult> {
  if (Platform.OS === 'web') {
    throw new Error('Saving screenshots to an album is not available on web.');
  }

  const asset = await MediaLibrary.createAssetAsync(fileUri);
  const album = await ensurePanditYatraAlbumAsync(asset, albumName);

  return {
    asset,
    album,
    fileUri,
  };
}

/**
 * Generates a shareable PDF with the captured image embedded. PDFs cannot be
 * saved to the photo album on every platform, so the user gets the native share
 * sheet and a stable local file URI.
 */
export async function createPdfFromCapturedImageAsync(
  base64Image: string,
  options: ScreenshotPdfOptions = {}
): Promise<string> {
  const title = options.title ?? 'PanditYatra Kundali';
  const subtitle = options.subtitle ?? 'Sacred chart exported from PanditYatra';
  const filePrefix = options.filePrefix ?? 'pandityatra-kundali';

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 24px; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #2f1b12; background: #fffaf3; }
          .page { min-height: 100vh; border: 4px solid #f97316; padding: 24px; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 18px; }
          h1 { margin: 0; color: #c2410c; font-size: 26px; }
          p { margin: 6px 0 0; color: #7c2d12; font-size: 13px; }
          img { width: 100%; max-width: 680px; display: block; margin: 0 auto; border: 1px solid #fed7aa; border-radius: 16px; }
          .footer { text-align: center; color: #9a3412; font-size: 10px; margin-top: 18px; }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="header">
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(subtitle)}</p>
          </section>
          <img src="data:image/jpeg;base64,${base64Image}" alt="${escapeHtml(title)}" />
          <section class="footer">Generated by PanditYatra on ${new Date().toLocaleString()}</section>
        </main>
      </body>
    </html>
  `;

  const printed = await Print.printToFileAsync({ html, base64: false });
  const targetUri = `${(FileSystem as any).documentDirectory}${createScreenshotFileName(filePrefix, 'pdf')}`;
  await FileSystem.copyAsync({ from: printed.uri, to: targetUri });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(targetUri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: title,
    });
  }

  return targetUri;
}

/**
 * Keeps generated HTML safe when names/places are inserted into exported PDFs.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
