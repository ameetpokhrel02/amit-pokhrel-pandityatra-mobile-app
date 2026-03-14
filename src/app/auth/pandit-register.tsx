import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '@/services/auth.service';

const EXPERTISE_OPTIONS = [
  'Vedic Rituals', 'Astrology & Kundali',
  'Marriage Ceremonies', 'Griha Pravesh',
  'Naming Ceremony', 'Funeral Rites',
  'Satyanarayan Puja', 'Lakshmi Puja',
  'Ganesh Puja', 'Navgraha Puja',
  'Rudrabhishek', 'Thread Ceremony',
  'All Ceremonies'
];

export default function PanditRegisterScreen() {
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
      Alert.alert('Required', 'Please fill in all required fields');
      return false;
    }
    if (!form.phone || form.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await registerUser({
        full_name: form.fullName,
        phone_number: formattedValue,
        email: form.email || undefined,
        password: form.password,
        role: 'pandit',
      });

      alert('Registration successful! Please verify your phone number.');
      router.push({
        pathname: '/auth/otp',
        params: { email: form.email, phone: formattedValue, mode: 'register' }
      } as any);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.headerTitle}>Register as Pandit</Text>
          <Text style={styles.headerSubtitle}>Join our network of verified priests</Text>

          <View style={styles.form}>
            <Input
              label="Full Name *"
              placeholder="Your full name"
              value={form.fullName}
              onChangeText={(t) => setForm({ ...form, fullName: t })}
              leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
            />

            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <CustomPhoneInput
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                onFormattedChange={setFormattedValue}
              />
            </View>

            <Input
              label="Email (Optional)"
              placeholder="your@email.com"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
            />

            <Input
              label="Password *"
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
              title={loading ? "Registering..." : "Continue"}
              onPress={handleSubmit}
              isLoading={loading}
              disabled={loading}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.link} onPress={() => router.push('/auth/login' as any)}>Login here</Text>
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
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    alignItems: 'center',
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
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 4,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#FF6F00',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
  },
  phoneInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
});
