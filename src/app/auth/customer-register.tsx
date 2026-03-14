import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
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
  const [formattedValue, setFormattedValue] = useState("");

  const validate = () => {
    if (!form.fullName || !form.phone || !form.password) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return false;
    }

    if (!form.phone || form.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
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
        phone_number: formattedValue,
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
            params: { email: form.email, phone: formattedValue, mode: 'register' }
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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
            onPress={() => {}}
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

            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <CustomPhoneInput
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                onFormattedChange={setFormattedValue}
              />
            </View>

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
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6F00',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 8,
  },
  googleButton: {
    marginBottom: 12,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  phoneInputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
});
