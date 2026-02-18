import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '@/services/auth.service';

export default function CustomerRegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    // Phone validation: Nepal format (starts with 98, 10 digits)
    const phoneRegex = /^98\d{8}$/;
    if (!phoneRegex.test(form.phone)) {
      Alert.alert('Invalid Phone', 'Phone number must be 10 digits and start with 98.');
      return false;
    }

    // Email validation: Contains '@'
    if (!form.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Password validation: Symbol, Number, Character
    const hasNumber = /\d/.test(form.password);
    const hasChar = /[a-zA-Z]/.test(form.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

    if (!hasNumber || !hasChar || !hasSymbol) {
      Alert.alert('Weak Password', 'Password must contain at least one letter, one number, and one symbol.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      // Use backend /api/users/register/ via auth.service adapter
      await registerUser({
        full_name: form.fullName,
        phone_number: form.phone,
        email: form.email,
        password: form.password,
        role: 'user',
      } as any);

      Alert.alert(
        'Success',
        'Account created successfully! Please verify your phone number.',
        [{
          text: 'OK',
          onPress: () => router.push({
            pathname: '/auth/otp',
            params: { email: form.email, phone: form.phone, mode: 'register' }
          } as any)
        }],
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Registration failed', e?.message || 'Please check your details and try again.');
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
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/pandit-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Join as Customer</Text>
        <Text style={styles.headerSubtitle}>Create an account to book Pujas</Text>

        <Button
          title="Sign up with Google"
          variant="outline"
          onPress={() => router.push('/auth/login' as any)}
          style={styles.googleButton}
          leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
        />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={form.fullName}
            onChangeText={(t) => setForm({ ...form, fullName: t })}
            leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Phone Number"
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
            leftIcon={<Ionicons name="call-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            }
          />

          <Button
            title={loading ? 'Creating account...' : 'Continue'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/auth/login' as any)}>Login</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  googleButton: {
    marginBottom: 12,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  orText: {
    marginHorizontal: 8,
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
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
});
