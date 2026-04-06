import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
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
    if (isLoading || !isNavigationMounted) return;

    const segment0 = segments[0];
    const segmentCount = (segments as any).length;
    const isRoot = segmentCount === 0 || (segmentCount === 1 && (String(segment0) === 'index' || String(segment0) === ''));

    // Only redirect if at the root or entering/exiting specific groups
    const inAuthGroup = segment0 === '(auth)';
    const inPublicGroup = segment0 === '(public)';
    const inCustomerGroup = segment0 === '(customer)';
    const inPanditGroup = segment0 === '(pandit)';
    const inVendorGroup = String(segment0) === '(vendor)';

    console.log('[Navigation] State:', {
      isAuthenticated,
      role,
      segment0,
      isRoot,
      inAuthGroup,
      inPublicGroup
    });

    // 1. Unauthenticated users (and non-guests) should be forced to Public/Auth screens
    if (!isAuthenticated && role !== 'guest') {
      if (!inPublicGroup && !inAuthGroup) {
        console.log('[Navigation] ⛔ Unauthenticated access to protected route. Diverting to Role Selection.');
        setTimeout(() => router.replace('/(public)/role-selection' as any), 0);
      }
    }
    // 2. Authenticated users (or guests at root) should be routed to their respective dashboards
    else if (isAuthenticated || role === 'guest') {
      const isPublicOrAuth = inPublicGroup || inAuthGroup;

      // Redirect away from public/auth if already authenticated
      // OR if at the root (initial app load)
      if ((isAuthenticated && (isPublicOrAuth || isRoot)) || (role === 'guest' && isRoot)) {
        if (role === 'pandit') {
          console.log('[Navigation] ✅ Authenticated Pandit. Routing to Dashboard.');
          setTimeout(() => router.replace('/(pandit)'), 0);
        } else if (role === 'vendor') {
          console.log('[Navigation] ✅ Authenticated Vendor. Routing to Dashboard.');
          setTimeout(() => router.replace('/(vendor)' as any), 0);
        } else {
          // Default for customers and guests
          console.log(`[Navigation] ✅ ${isAuthenticated ? 'Authenticated' : 'Initial'} ${role}. Routing to Home.`);
          setTimeout(() => router.replace('/(customer)'), 0);
        }
      }

      // Prevent cross-role access
      if (role === 'pandit' && inCustomerGroup) {
        setTimeout(() => router.replace('/(pandit)'), 0);
      } else if (role === 'vendor' && (inCustomerGroup || inPanditGroup)) {
        setTimeout(() => router.replace('/(vendor)' as any), 0);
      } else if ((role === 'customer' || role === 'guest') && (inPanditGroup || inVendorGroup)) {
        setTimeout(() => router.replace('/(customer)'), 0);
      }
    }
  }, [isAuthenticated, isLoading, role, isNavigationMounted, segments[0]]); // Only depend on first segment to avoid re-running on nested tab changes

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
