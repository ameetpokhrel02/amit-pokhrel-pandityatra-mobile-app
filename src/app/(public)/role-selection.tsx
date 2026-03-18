import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuthStore();

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace('/(customer)');
  };

  const selectRole = (role: 'user' | 'pandit') => {
    if (role === 'pandit') {
       router.push('/(auth)/pandit/login' as any);
    } else {
       router.push('/(auth)/user/login' as any);
    }
  };

  return (
    <ImageBackground
      source={require('@/../assets/images/spash 4.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/../assets/images/pandit-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>PanditYatra</Text>
          <Text style={styles.subtitle}>Connecting Faith with Excellence</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Join as User"
            onPress={() => selectRole('user')}
            style={styles.button}
          />

          <Button
            title="Join as Pandit"
            variant="secondary"
            onPress={() => selectRole('pandit')}
            style={styles.button}
          />

          <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
            <Text style={styles.guestText}>Explore as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 60,
  },
  button: {
    width: '100%',
    height: 56,
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
