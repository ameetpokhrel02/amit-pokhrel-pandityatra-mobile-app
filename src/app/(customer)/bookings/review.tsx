import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Button } from '@/components/ui/Button';
import apiClient from '@/services/api-client';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/reviews/create/', {
        booking: Number(bookingId),
        rating: rating,
        comment: comment,
      });
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Rate Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>How was your experience?</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#AAA' : '#666' }]}>
            Your review helps us improve and helps others choose better Pandits.
          </Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons 
                  name={star <= rating ? "star" : "star-outline"} 
                  size={48} 
                  color={star <= rating ? "#FFD700" : (isDark ? "#333" : "#E0E0E0")} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Care to share more? (Optional)</Text>
            <TextInput
              style={[
                styles.textInput, 
                { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#333' : '#E0E0E0' }
              ]}
              placeholder="What did you like or what could be improved?"
              placeholderTextColor={isDark ? '#777' : '#999'}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Button 
            title={loading ? "Submitting..." : "Submit Review"}
            onPress={handleSubmit}
            isLoading={loading}
            disabled={rating === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  ratingContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 150,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
