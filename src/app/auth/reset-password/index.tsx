import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { resetPasswordWithToken } from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    // Validation
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const token = params.token as string;
    if (!token) {
      Alert.alert('Error', 'Reset token not found. Please start the process again.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithToken({ token, new_password: password });
      Alert.alert(
        'Success',
        'Password reset successfully! You can now login with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login' as any) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to reset password. Please try again.');
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

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Create a new strong password for your account</Text>

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Reset Password"
            onPress={handleReset}
            style={styles.submitButton}
            disabled={loading}
          />
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
  submitButton: {
    marginTop: 16,
  },
});
