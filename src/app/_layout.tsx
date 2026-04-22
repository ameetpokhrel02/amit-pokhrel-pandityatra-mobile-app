import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications } from '@/hooks/useNotifications';
import '@/i18n'; // Initialize i18n
import '../../global.css'; // Import NativeWind styles
import { StripeProvider } from '@stripe/stripe-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { VideoCallProvider, useVideoCall } from '@/store/VideoCallContext';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { useLocationStore } from '@/store/location.store';
import Toast from 'react-native-toast-message';

const LazyNativeVideoCall = React.lazy(() => import('@/components/video/NativeVideoCall').then(m => ({ default: m.NativeVideoCall })));

function VideoCallContainer() {
  const { isCallActive, isConnecting } = useVideoCall();
  if (!isCallActive && !isConnecting) return null;
  return (
    <LazyLoader>
      <LazyNativeVideoCall />
    </LazyLoader>
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();
  const { detectLocation } = useLocationStore();
  useNotifications();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const lastNavPath = useRef<string>('');

  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    // ─── Roboto (Primary UI font) ───────────────────────────────
    'Roboto-Regular': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf'),
    'Roboto-Bold': require('@/assets/fonts/Roboto-Bold.ttf'),
    'Roboto-Light': require('@/assets/fonts/Roboto-Light.ttf'),
    // ─── Lato (Accent / display font) ──────────────────────────
    'Lato-Regular': require('@/assets/fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('@/assets/fonts/Lato-Bold.ttf'),
    'Lato-Italic': require('@/assets/fonts/Lato-Italic.ttf'),
  });

  useEffect(() => {
    initialize();
    detectLocation(); // Auto-detect location on app load

    // Set navigation ready after a short initial delay to show the orange splash screen (2.5s)
    const readyTimer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 2500);
    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (!isLoading && isNavigationReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isNavigationReady, fontsLoaded, fontError]);

  const navigationState = useRootNavigationState();
  const isNavigationMounted = !!navigationState?.key;

  // Handle centralized redirection
  useEffect(() => {
    // We must wait for:
    // 1. Auth and critical stores to finish loading
    // 2. Navigation State to be mounted (Expo Router requirement)
    // 3. Our custom initialization delay (splash screen duration) to be ready
    if (isLoading || !isNavigationMounted || !isNavigationReady) return;

    const segment0 = segments[0];
    const segmentCount = (segments as any).length;
    
    // Improved isRoot check to catch undefined or empty segments frequently encountered during transitions
    const isRoot = segmentCount === 0 || (segmentCount === 1 && (!segment0 || String(segment0) === 'index' || String(segment0) === '' || String(segment0) === 'undefined'));

    const inAuthGroup = segment0 === '(auth)';
    const inPublicGroup = segment0 === '(public)';

    console.log('[Navigation] State:', {
      isAuthenticated,
      isRoot,
      role,
      segment0: String(segment0),
      segments
    });

    const safeReplace = (path: any) => setTimeout(() => router.replace(path), 0);

    // 1. Initial routing logic for the absolute root entry point
    if (isRoot) {
      if (isAuthenticated) {
        if (role === 'pandit') safeReplace('/(pandit)');
        else if (role === 'vendor') safeReplace('/(vendor)' as any);
        else safeReplace('/(customer)');
      } else if (role === 'guest') {
        safeReplace('/(customer)');
      } else {
        safeReplace('/(public)/role-selection');
      }
      return;
    }

    // 2. Persistent Security guards
    const currentPath = segments.join('/');
    
    // Track Page View
    import('@/services/analytics.service').then(m => {
        m.trackPageView(currentPath || 'index', { role, isAuthenticated });
    });

    // Prevent double navigation to the same target
    if (lastNavPath.current === currentPath) return;

    const subSegment = segments[1];

    if (!isAuthenticated) {
      // Guests are allowed in (customer), (public), and (auth)
      // They are NOT allowed in (pandit) or (vendor)
      if (segment0 === '(pandit)' || segment0 === '(vendor)') {
        lastNavPath.current = '(customer)';
        safeReplace('/(customer)');
      }
      
      // Guest sub-route protection
      const guestForbiddenSubRoutes = ['recordings', 'kundali', 'preferences', 'edit-profile', 'kundali-history', 'wishlist'];
      if (segment0 === '(customer)' && guestForbiddenSubRoutes.includes(subSegment as string)) {
        lastNavPath.current = '(customer)';
        safeReplace('/(customer)');
      }
    } else {
      // Authenticated User Guards
      
      // 1. Move user OUT of auth/public screens if they are already authenticated
      if (segment0 === '(auth)' || segment0 === '(public)') {
        if (role === 'pandit') {
            lastNavPath.current = '(pandit)';
            safeReplace('/(pandit)');
        } else if (role === 'vendor') {
            lastNavPath.current = '(vendor)';
            safeReplace('/(vendor)' as any);
        } else {
            lastNavPath.current = '(customer)';
            safeReplace('/(customer)');
        }
        return;
      }

      // 2. Cross-role protection
      const isSharedRoute = subSegment === 'reviews';
      
      if (!isSharedRoute) {
        if (role === 'pandit' && segment0 === '(customer)') {
          lastNavPath.current = '(pandit)';
          safeReplace('/(pandit)');
        } else if (role === 'vendor' && (segment0 === '(customer)' || segment0 === '(pandit)')) {
          lastNavPath.current = '(vendor)';
          safeReplace('/(vendor)' as any);
        }
      }
    }

    console.log('[Navigation] Final State:', { isAuthenticated, role, currentPath });
  }, [isAuthenticated, role, segments, isNavigationReady, isLoading, isNavigationMounted]);

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <ThemeProvider>
        <VideoCallProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* ... existing screens ... */}
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(auth)/user" />
            <Stack.Screen name="(auth)/pandit" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(pandit)" />
            <Stack.Screen name="(vendor)" />
            <Stack.Screen name="(auth)/vendor" />
            <Stack.Screen name="video" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="chat/index" />
            <Stack.Screen name="chat/[id]" />
          </Stack>
          <VideoCallContainer />
        </VideoCallProvider>
      </ThemeProvider>
      <Toast />
    </StripeProvider>
  );
}
