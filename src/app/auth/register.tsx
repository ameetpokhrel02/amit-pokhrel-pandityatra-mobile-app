import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/pandit-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Choose how you want to join PanditYatra</Text>

        <View style={styles.buttonContainer}>
          <Button 
            title="Register as Customer" 
            onPress={() => router.push('/auth/customer-register' as any)} 
            style={styles.button}
          />
          
          <Button 
            title="Register as Pandit" 
            variant="outline"
            onPress={() => router.push('/auth/pandit-register' as any)} 
            style={styles.panditButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.link} onPress={() => router.push('/auth/login' as any)}>Login</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  button: {
    width: '100%',
  },
  panditButton: {
    width: '100%',
    borderColor: '#FF6F00',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  link: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
});
