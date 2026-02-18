import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="customer-register" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="otp-verify/index" />
      <Stack.Screen name="reset-password/index" />
      <Stack.Screen name="pandit-register" options={{ headerShown: true, title: 'Pandit Registration', headerTintColor: Colors.light.primary }} />
    </Stack>
  );
}
