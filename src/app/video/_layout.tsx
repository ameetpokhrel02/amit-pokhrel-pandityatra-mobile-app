import { Stack } from 'expo-router';

export default function VideoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[bookingId]" />
    </Stack>
  );
}
