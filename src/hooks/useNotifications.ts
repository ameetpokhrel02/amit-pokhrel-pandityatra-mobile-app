import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { registerPushToken } from '@/services/notification.service';
import { useAuthStore } from '@/store/auth.store';

/**
 * useNotifications
 * Handles push notification registration and messaging.
 * Uses dynamic require to avoid crashing in Expo Go when Firebase is missing.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    let messaging: any;
    try {
        // Dynamic require to prevent crash on module evaluation in Expo Go
        messaging = require('@react-native-firebase/messaging').default;
    } catch (e) {
        console.warn('[Notifications] Native Firebase modules not found. Push notifications disabled in this environment.');
        return;
    }

    const setupNotifications = async () => {
      try {
        // 1. Request Permission (iOS only, Android is handled in manifest)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === 1 || // AUTHORIZED
          authStatus === 2;   // PROVISIONAL

        if (enabled) {
          console.log('[Notifications] Authorization status:', authStatus);
          
          // 2. Get Token
          const token = await messaging().getToken();
          if (token) {
            const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
            console.log(`[Notifications] Firebase Token (${deviceType}):`, token);
            
            // 3. Register with backend
            await registerPushToken(token, deviceType).catch(err => {
                console.error('[Notifications] Backend registration failed:', err);
            });
          }
        }
      } catch (error) {
        console.error('[Notifications] Setup failed:', error);
      }
    };

    setupNotifications();

    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log('[Notifications] Foreground Message:', JSON.stringify(remoteMessage));
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || ''
      );
    });

    // Listen for background message clicks
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('[Notifications] Notification caused app to open from background:', remoteMessage.data);
      if (remoteMessage.data?.route) {
          const targetRoute = remoteMessage.data.route.includes('admin') ? '/notifications' : remoteMessage.data.route;
          router.push(targetRoute as any);
      } else {
          router.push('/notifications' as any);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, router]);
}
