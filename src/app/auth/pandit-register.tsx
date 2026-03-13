import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

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
      const { registerUser } = require('@/services/auth.service');
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

        {/* Header Image Placeholder */}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', 
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
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
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F3E8D6', // Beige background for expertise area
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  languageOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  languageText: {
    fontSize: 14,
    color: '#4B5563',
  },
  languageTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  dropdown: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#4B5563',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FDF8F6', // Match background or slightly darker
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#FF6F00', 
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
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
  phoneContainer: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    height: 56,
  },
  phoneTextContainer: {
    borderRadius: 8,
    backgroundColor: "#FFF",
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontSize: 16,
    color: '#1F2937',
    height: 56,
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  phoneFlagButton: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
});
