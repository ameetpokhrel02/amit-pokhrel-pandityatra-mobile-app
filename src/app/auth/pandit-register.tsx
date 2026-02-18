import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
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
    experience: '',
    bio: '',
    language: '',
  });

  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  const toggleExpertise = (item: string) => {
    if (item === 'All Ceremonies') {
      if (selectedExpertise.includes('All Ceremonies')) {
        setSelectedExpertise([]);
      } else {
        setSelectedExpertise(EXPERTISE_OPTIONS);
      }
      return;
    }

    if (selectedExpertise.includes(item)) {
      setSelectedExpertise(selectedExpertise.filter(i => i !== item));
    } else {
      setSelectedExpertise([...selectedExpertise, item]);
    }
  };

  const handleSubmit = () => {
    // TODO: Submit registration
    alert('Registration submitted for verification!');
    router.replace('/auth/login' as any);
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
        <Text style={styles.headerSubtitle}>Share your expertise with seekers</Text>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            placeholder="Your full name"
            value={form.fullName}
            onChangeText={(t) => setForm({ ...form, fullName: t })}
            leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Phone Number *"
            placeholder="9841234567"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
            leftIcon={<Ionicons name="call-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Email (Optional)"
            placeholder="your@email.com"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
          />

          {/* Areas of Expertise */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Areas of Expertise * (Select all that apply)</Text>
            <View style={styles.expertiseGrid}>
              {EXPERTISE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.checkboxRow}
                  onPress={() => toggleExpertise(item)}
                >
                  <View style={[styles.checkbox, selectedExpertise.includes(item) && styles.checkboxChecked]}>
                    {selectedExpertise.includes(item) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Primary Language */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Primary Language *</Text>
            <View style={styles.languageContainer}>
              {['Nepali', 'English', 'Hindi', 'Maithili'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    form.language === lang && styles.languageOptionSelected
                  ]}
                  onPress={() => setForm({ ...form, language: lang })}
                >
                  <Text style={[
                    styles.languageText,
                    form.language === lang && styles.languageTextSelected
                  ]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Years of Experience */}
          <Input
            label="Years of Experience *"
            placeholder="e.g., 10"
            keyboardType="numeric"
            value={form.experience}
            onChangeText={(t) => setForm({ ...form, experience: t })}
            leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
          />

          {/* Brief Bio */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brief Bio (Optional)</Text>
            <Input
              placeholder="Tell us about yourself and your experience..."
              multiline
              numberOfLines={4}
              style={styles.textArea}
              value={form.bio}
              onChangeText={(t) => setForm({ ...form, bio: t })}
            />
          </View>

          {/* Certification Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Certification/License *</Text>
            <TouchableOpacity style={styles.uploadBox}>
              <Ionicons name="cloud-upload-outline" size={32} color="#D97706" />
              <Text style={styles.uploadTitle}>Upload certification</Text>
              <Text style={styles.uploadSubtitle}>PDF, JPG, PNG (max 5MB)</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Submit for Verification"
            onPress={handleSubmit}
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
    backgroundColor: '#FDF8F6', // Light cream background
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
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
    backgroundColor: '#E09F7D', // Match the button color in screenshot
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
});
