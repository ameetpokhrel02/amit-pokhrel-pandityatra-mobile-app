import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { verifyPasswordResetOtp, requestPasswordResetOtp } from '@/services/api';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      if (params.mode === 'reset-password') {
        const email = params.email as string;
        const response = await verifyPasswordResetOtp({ email, otp });

        // Navigate to reset password screen with token
        router.push({
          pathname: '/auth/reset-password',
          params: { token: response.token, email }
        } as any);
      } else {
        // Registration flow - just navigate to login
        Alert.alert('Success', 'Verification successful');
        router.replace('/auth/login' as any);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = params.email as string;
    if (!email) {
      Alert.alert('Error', 'Email not found. Please go back and try again.');
      return;
    }

    setResending(true);
    try {
      await requestPasswordResetOtp({ email });
      Alert.alert('Success', 'New verification code sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
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

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {params.identifier || 'your device'}</Text>

          <Input
            label="OTP Code"
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />

          <Button
            title="Verify & Proceed"
            onPress={handleVerify}
            style={styles.submitButton}
            disabled={loading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive code? </Text>
            <Text
              style={[styles.link, resending && styles.linkDisabled]}
              onPress={resending ? undefined : handleResend}
            >
              {resending ? 'Sending...' : 'Resend'}
            </Text>
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
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
  linkDisabled: {
    opacity: 0.5,
  },
});
