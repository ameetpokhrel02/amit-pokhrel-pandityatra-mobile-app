import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { registerPushToken } from '@/services/notification.service';
import Constants from 'expo-constants';

// Safe dynamic imports for native-only modules
let Device: any;
try {
  Device = require('expo-device');
} catch (e) {
  console.warn('[Notifications] expo-device module not available');
}

// Configure how notifications are displayed when the app is in the foreground
try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
} catch (e) {
    console.warn('[Notifications] Failed to set notification handler');
}

export function useNotifications() {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const setup = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
              const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
              console.log(`[Notifications] Expo Push Token: ${token}`);
              registerPushToken(token, deviceType).catch(err => {
                console.error('[Notifications] Backend registration failed:', err);
              });
            }

            // This listener is fired whenever a notification is received while the app is foregrounded
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
              console.log('[Notifications] Foreground Notification Received:', notification);
            });

            // This listener is fired whenever a user taps on or interacts with a notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
              const data: any = response.notification.request.content.data;
              console.log('[Notifications] Notification Response:', data);
              
              if (data && typeof data === 'object' && 'route' in data) {
                const targetRoute = String(data.route).includes('admin') ? '/notifications' : data.route;
                router.push(targetRoute as any);
              } else {
                router.push('/notifications' as any);
              }
            });
        } catch (err) {
            console.warn('[Notifications] Setup failed:', err);
        }
    };

    setup();

    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, role, router]);
}

async function registerForPushNotificationsAsync() {
  let token;

  try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device?.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('[Notifications] Failed to get push token for push notification!');
          return;
        }
        
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
        if (!projectId) {
            console.error('[Notifications] Project ID not found in config. Check app.json/eas.json');
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        console.warn('[Notifications] Must use physical device for Push Notifications');
      }
  } catch (err) {
      console.warn('[Notifications] Error in registration:', err);
  }

  return token;
}
