import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications } from '@/hooks/useNotifications';
import '@/i18n'; // Initialize i18n
import '../../global.css'; // Import NativeWind styles
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();
  useNotifications();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    initialize();
    
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

  // Handle centralized redirection
  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const segment0 = segments[0];
    const segmentCount = (segments as any).length;
    const isRoot = segmentCount === 0 || (segmentCount === 1 && (String(segment0) === 'index' || String(segment0) === ''));
    
    // Only redirect if at the root or entering/exiting specific groups
    const inAuthGroup = segment0 === '(auth)';
    const inPublicGroup = segment0 === '(public)';
    const inCustomerGroup = segment0 === '(customer)';
    const inPanditGroup = segment0 === '(pandit)';

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
        router.replace('/(public)/role-selection' as any);
      }
    } 
    // 2. Authenticated users (or guests) should be routed to their respective dashboards if they stray
    else if (isAuthenticated || role === 'guest') {
      const isPublicOrAuth = inPublicGroup || inAuthGroup || isRoot;
      
      if (isPublicOrAuth) {
        if (role === 'pandit') {
          console.log('[Navigation] ✅ Authenticated Pandit. Routing to Dashboard.');
          router.replace('/(pandit)');
        } else {
          // Default for customers and guests
          console.log(`[Navigation] ✅ Authenticated ${role}. Routing to Home.`);
          router.replace('/(customer)');
        }
      }
      
      // Prevent cross-role access
      if (role === 'pandit' && inCustomerGroup) {
        router.replace('/(pandit)');
      } else if ((role === 'customer' || role === 'guest') && inPanditGroup) {
        router.replace('/(customer)');
      }
    }
  }, [isAuthenticated, isLoading, role, isNavigationReady, segments[0]]); // Only depend on first segment to avoid re-running on nested tab changes

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Initial entry point */}
          <Stack.Screen name="index" />
          
          {/* Public screens (Welcome, Onboarding, Guest) */}
          <Stack.Screen name="(public)" />
          
          {/* Role-specific Auth flows (now using their own layouts) */}
          <Stack.Screen name="(auth)/user" />
          <Stack.Screen name="(auth)/pandit" />
  
          {/* Private Application flows */}
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(pandit)" />
  
          {/* Shared screens (Explicitly registered groups) */}
          <Stack.Screen name="video" />
          <Stack.Screen name="notifications/index" />
          <Stack.Screen name="chat" />
        </Stack>
      </ThemeProvider>
    </StripeProvider>
  );
}
