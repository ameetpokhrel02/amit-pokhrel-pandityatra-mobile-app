import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/pandit-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>PanditYatra</Text>
        <Text style={styles.subtitle}>Book Pandits for your Puja</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Join as Customer"
          onPress={() => router.push('/auth/login' as any)}
          style={styles.button}
        />

        <Button
          title="Join as Pandit"
          variant="secondary"
          onPress={() => router.push('/auth/pandit-register' as any)}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'Playfair Display', // Fallback handled by system if not loaded
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
  textButton: {
    marginTop: 8,
  },
});
