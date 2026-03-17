import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ContactScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const res = await import('@/services/auth.service').then(m => m.contactUs(form));
      Alert.alert('Success', 'Your message has been sent. We will get back to you shortly.');
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
      </View>

      <Text style={styles.subtitle}>Have questions? Reach out to us!</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={20} color="#f97316" />
          <Text style={styles.infoText}>Kathmandu, Nepal</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#f97316" />
          <Text style={styles.infoText}>support@pandityatra.com</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#f97316" />
          <Text style={styles.infoText}>+977-9876543210</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your name"
          value={form.name}
          onChangeText={(v) => setForm({...form, name: v})}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your email"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => setForm({...form, email: v})}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="How can we help you?"
          multiline
          numberOfLines={4}
          value={form.message}
          onChangeText={(v) => setForm({...form, message: v})}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  subtitle: { fontSize: 16, color: '#3E2723', marginBottom: 20 },
  infoCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { fontSize: 16, color: '#3E2723', marginLeft: 10 },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#3E2723', marginBottom: 5 },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { 
    backgroundColor: '#f97316', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
