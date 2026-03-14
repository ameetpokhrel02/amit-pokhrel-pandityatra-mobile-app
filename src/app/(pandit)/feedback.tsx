import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PanditFeedbackScreen() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0 || !feedback) {
      Alert.alert('Error', 'Please provide both a rating and your feedback.');
      return;
    }
    Alert.alert('Thank You', 'Your feedback has been submitted successfully to the PanditYatra team.');
    setFeedback('');
    setRating(0);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>App Feedback</Text>
      </View>

      <Text style={styles.subtitle}>Help us improve your experience as a Pandit on the platform.</Text>

      <View style={styles.ratingSection}>
        <Text style={styles.label}>Rate your experience with the app</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Ionicons 
                name={s <= rating ? 'star' : 'star-outline'} 
                size={40} 
                color={s <= rating ? '#f97316' : '#ccc'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Your Suggestions / Issues</Text>
        <TextInput 
          style={styles.textArea} 
          placeholder="Tell us what you like or what we can improve..."
          multiline
          numberOfLines={6}
          value={feedback}
          onChangeText={setFeedback}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Your feedback is directly reviewed by our product team to help make PanditYatra better for all Vedic practitioners.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 25 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: 40 
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, lineHeight: 22 },
  ratingSection: { alignItems: 'center', marginBottom: 35 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#3E2723', marginBottom: 15 },
  starRow: { flexDirection: 'row', gap: 10 },
  formSection: { marginBottom: 30 },
  textArea: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    height: 150, 
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    color: '#3E2723'
  },
  submitBtn: { 
    backgroundColor: '#f97316', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 3,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: '#666', marginLeft: 10, lineHeight: 18 },
});
