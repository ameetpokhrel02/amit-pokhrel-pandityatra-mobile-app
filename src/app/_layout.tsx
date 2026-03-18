import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import '@/i18n'; // Initialize i18n
import '../../global.css'; // Import NativeWind styles

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    initialize();
    
    // Set navigation ready after a short initial delay to show the orange splash screen (2.5s)
    const readyTimer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 2500);
    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (!isLoading && isNavigationReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isNavigationReady]);

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

    if (!isAuthenticated && role !== 'guest') {
      if (isRoot || inCustomerGroup || inPanditGroup) {
        console.log('[Navigation] Redirecting to Role Selection...');
        router.replace('/(public)/role-selection' as any);
      }
    } else if (isAuthenticated || role === 'guest') {
      if (role === 'customer' || role === 'user' || role === 'guest') {
        if (isRoot || inPanditGroup) {
          router.replace('/(customer)');
        }
      } else if (role === 'pandit') {
        if (isRoot || inCustomerGroup) {
          router.replace('/(pandit)');
        }
      }
    }
  }, [isAuthenticated, isLoading, role, isNavigationReady, segments[0]]); // Only depend on first segment to avoid re-running on nested tab changes

  return (
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
        <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
      </Stack>
    </ThemeProvider>
  );
}
