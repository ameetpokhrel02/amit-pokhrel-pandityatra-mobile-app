/**
 * useAppPermissions
 * -----------------
 * Centralised permission management for PanditYatra.
 * Handles startup checks, custom explanations, iOS/Android
 * differences, and fallback messaging for denied states.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type PermissionKey =
  | 'mediaLibrary'
  | 'camera'
  | 'notifications'
  | 'location'
  | 'backgroundLocation';

export type PermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'limited' // iOS 14+ photo library limited access
  | 'checking';

export interface PermissionState {
  mediaLibrary: PermissionStatus;
  camera: PermissionStatus;
  notifications: PermissionStatus;
  location: PermissionStatus;
  backgroundLocation: PermissionStatus;
}

export interface PermissionConfig {
  /** Explanation shown BEFORE the native dialog (recommended practice) */
  rationale?: string;
  /** Label on the primary action button */
  actionLabel?: string;
  /** Whether to open Settings if the permission was previously denied */
  openSettingsOnDenied?: boolean;
}

// ─────────────────────────────────────────
// Human-readable descriptions per key
// ─────────────────────────────────────────

const PERMISSION_INFO: Record<
  PermissionKey,
  { title: string; defaultRationale: string; settingsHint: string }
> = {
  mediaLibrary: {
    title: 'Photos & Media Access',
    defaultRationale:
      'PanditYatra needs access to your photo library to save screenshots of your invoices, Kundali charts, and booking confirmations.',
    settingsHint:
      'Please open Settings and grant "Photos" permission to PanditYatra so you can save and share your sacred documents.',
  },
  camera: {
    title: 'Camera Access',
    defaultRationale:
      'PanditYatra uses your camera to let you upload a profile picture and scan ritual documents.',
    settingsHint:
      'Please open Settings and grant "Camera" permission to PanditYatra.',
  },
  notifications: {
    title: 'Push Notifications',
    defaultRationale:
      'Enable notifications so PanditYatra can remind you of upcoming pujas, booking updates, and special offers.',
    settingsHint:
      'Please open Settings and enable "Notifications" for PanditYatra.',
  },
  location: {
    title: 'Location Access',
    defaultRationale:
      'PanditYatra uses your location to suggest nearby pandits and prefill your booking address.',
    settingsHint:
      'Please open Settings and grant "Location" permission to PanditYatra.',
  },
  backgroundLocation: {
    title: 'Background Location Access',
    defaultRationale:
      'PanditYatra uses background location only for active spiritual service logistics, such as nearby pandit discovery and booking delivery coordination. This helps us provide better service when you have ongoing bookings.',
    settingsHint:
      'Please open Settings and grant "Allow all the time" location permission to PanditYatra for delivery coordination.',
  },
};

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useAppPermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    mediaLibrary: 'checking',
    camera: 'checking',
    notifications: 'checking',
    location: 'checking',
    backgroundLocation: 'checking',
  });

  const [isChecking, setIsChecking] = useState(true);
  const initialized = useRef(false);

  // ─── Helpers ──────────────────────────

  const updatePermission = useCallback(
    (key: PermissionKey, status: PermissionStatus) => {
      setPermissions((prev) => ({ ...prev, [key]: status }));
    },
    []
  );

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() =>
      Alert.alert('Error', 'Unable to open Settings automatically.')
    );
  }, []);

  const showDeniedDialog = useCallback(
    (key: PermissionKey) => {
      const info = PERMISSION_INFO[key];
      Alert.alert(
        `${info.title} Required`,
        info.settingsHint,
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: openSettings,
          },
        ],
        { cancelable: true }
      );
    },
    [openSettings]
  );

  // ─── Individual checkers ──────────────

  const checkMediaLibrary = useCallback(async (): Promise<PermissionStatus> => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    // iOS returns 'restricted' for parental controls; treat as denied
    return 'undetermined';
  }, []);

  const checkCamera = useCallback(async (): Promise<PermissionStatus> => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, []);

  const checkNotifications = useCallback(async (): Promise<PermissionStatus> => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, []);

  const checkLocation = useCallback(async (): Promise<PermissionStatus> => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, []);

  const checkBackgroundLocation = useCallback(async (): Promise<PermissionStatus> => {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, []);

  // ─── Startup check (silent, no dialogs) ──

  const checkAllPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const [media, camera, notif, location, bgLocation] = await Promise.all([
        checkMediaLibrary(),
        checkCamera(),
        checkNotifications(),
        checkLocation(),
        checkBackgroundLocation(),
      ]);

      setPermissions({
        mediaLibrary: media,
        camera: camera,
        notifications: notif,
        location: location,
        backgroundLocation: bgLocation,
      });
    } catch (err) {
      console.warn('[Permissions] Startup check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, [checkMediaLibrary, checkCamera, checkNotifications, checkLocation, checkBackgroundLocation]);

  // ─── Request individual permission with optional custom rationale ──

  const requestPermission = useCallback(
    async (
      key: PermissionKey,
      config?: PermissionConfig
    ): Promise<PermissionStatus> => {
      const info = PERMISSION_INFO[key];
      const rationale = config?.rationale ?? info.defaultRationale;
      const actionLabel = config?.actionLabel ?? 'Allow Access';
      const openSettingsOnDenied = config?.openSettingsOnDenied ?? true;

      // If already granted, return immediately
      const currentStatus = permissions[key];
      if (currentStatus === 'granted') return 'granted';

      // Show pre-request explanation dialog (best practice)
      return new Promise<PermissionStatus>((resolve) => {
        // On Android we can always show rationale; on iOS show before first request
        if (Platform.OS === 'android' || currentStatus === 'undetermined') {
          Alert.alert(
            `Allow ${info.title}?`,
            rationale,
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => {
                  resolve('denied');
                },
              },
              {
                text: actionLabel,
                onPress: async () => {
                  const result = await _requestNative(key);
                  updatePermission(key, result);

                  if (result === 'denied' && openSettingsOnDenied) {
                    showDeniedDialog(key);
                  }
                  resolve(result);
                },
              },
            ],
            { cancelable: false }
          );
        } else if (currentStatus === 'denied') {
          // Already denied — send user to Settings
          if (openSettingsOnDenied) showDeniedDialog(key);
          resolve('denied');
        } else {
          // Fallback: just request directly
          _requestNative(key).then((result) => {
            updatePermission(key, result);
            resolve(result);
          });
        }
      });
    },
    [permissions, showDeniedDialog, updatePermission]
  );

  // ─── Native request dispatcher ─────────

  const _requestNative = async (key: PermissionKey): Promise<PermissionStatus> => {
    try {
      switch (key) {
        case 'mediaLibrary': {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          return status === 'granted' ? 'granted' : 'denied';
        }
        case 'camera': {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          return status === 'granted' ? 'granted' : 'denied';
        }
        case 'notifications': {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          return status === 'granted' ? 'granted' : 'denied';
        }
        case 'location': {
          const { status } = await Location.requestForegroundPermissionsAsync();
          return status === 'granted' ? 'granted' : 'denied';
        }
        case 'backgroundLocation': {
          // Must request foreground first before background
          const foreground = await Location.requestForegroundPermissionsAsync();
          if (foreground.status !== 'granted') {
            return 'denied';
          }
          const { status } = await Location.requestBackgroundPermissionsAsync();
          return status === 'granted' ? 'granted' : 'denied';
        }
      }
    } catch (err) {
      console.warn(`[Permissions] Failed to request ${key}:`, err);
      return 'denied';
    }
  };

  // ─── Convenience helpers ───────────────

  const isGranted = useCallback(
    (key: PermissionKey) => permissions[key] === 'granted',
    [permissions]
  );

  const isDenied = useCallback(
    (key: PermissionKey) => permissions[key] === 'denied',
    [permissions]
  );

  // ─── Run startup check once ────────────

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      checkAllPermissions();
    }
  }, [checkAllPermissions]);

  return {
    permissions,
    isChecking,
    isGranted,
    isDenied,
    requestPermission,
    checkAllPermissions,
    openSettings,
  };
}
