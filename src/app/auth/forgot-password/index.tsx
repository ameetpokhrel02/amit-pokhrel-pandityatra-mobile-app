import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { requestPasswordResetOtp } from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    // Validate email or phone
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    // Basic email/phone validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^98\d{8}$/;
    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      Alert.alert('Error', 'Please enter a valid email address or 10-digit phone number starting with 98');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordResetOtp({ email: identifier });
      Alert.alert('Success', 'Verification code sent to your email');
      router.push({ pathname: '/auth/otp', params: { email: identifier, mode: 'reset-password' } } as any);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email or phone number to receive a verification code.</Text>

          <Input
            label="Email or Phone"
            placeholder="Enter email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
          />

          <Button
            title="Send Verification Code"
            onPress={handleSendOTP}
            style={styles.submitButton}
            disabled={loading}
          />

          <View style={styles.footer}>
            <Text style={styles.link} onPress={() => router.back()}>Back to Login</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  link: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
});
