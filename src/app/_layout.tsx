import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/store/AuthContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { UserProvider } from '@/store/UserContext';
import '@/i18n'; // Initialize i18n
import '../../global.css'; // Import NativeWind styles

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth / startup routing */}
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />

            {/* Customer app (tabs) */}
            <Stack.Screen name="(customer)" />

            {/* Pandit app (tabs) */}
            <Stack.Screen name="(pandit)" />

            {/* Admin dashboard */}
            <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
          </Stack>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
