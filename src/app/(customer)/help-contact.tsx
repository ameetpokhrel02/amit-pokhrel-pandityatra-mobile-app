import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { contactUs } from '@/services/auth.service';

export default function ContactSupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setSubmitting(true);
      await contactUs(form);
      Alert.alert('Success', 'Your message has been sent. We will get back to you shortly.');
      setForm({ name: '', email: '', message: '' });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
          Need help with your booking or have any questions? Our team is here for you.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
              placeholder="Enter your name"
              placeholderTextColor={colors.text + '40'}
              value={form.name}
              onChangeText={(v) => setForm({...form, name: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
              placeholder="Enter your email"
              placeholderTextColor={colors.text + '40'}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => setForm({...form, email: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>How can we help?</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
              placeholder="Describe your issue or question..."
              placeholderTextColor={colors.text + '40'}
              multiline
              numberOfLines={6}
              value={form.message}
              onChangeText={(v) => setForm({...form, message: v})}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitText}>Send Message</Text>
                <Ionicons name="send" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Other Ways to Connect</Text>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>support@pandityatra.com</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>+977-9876543210</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 20
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 30 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: 'bold' },
  input: { 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 15
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitButton: { 
    flexDirection: 'row',
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  infoSection: { marginTop: 40, paddingTop: 30, borderTopWidth: 1, gap: 15 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 15 },
});
