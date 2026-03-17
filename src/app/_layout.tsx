import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import '@/i18n'; // Initialize i18n
import '../../global.css'; // Import NativeWind styles

import { UserProvider } from '@/store/UserContext';
import { ChatProvider } from '@/store/ChatContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <ThemeProvider>
      <UserProvider>
        <ChatProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth / startup routing */}
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            
            {/* Public screens (About, Contact, etc.) */}
            <Stack.Screen name="(public)" />

            {/* Customer app (tabs) */}
            <Stack.Screen name="(customer)" />

            {/* Pandit app (tabs) */}
            <Stack.Screen name="(pandit)" />

            {/* Admin dashboard */}
            <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
          </Stack>
        </ChatProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
