import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { bookingId, panditName, date, time } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your spiritual journey is scheduled. {panditName} is looking forward to performing the ritual for you.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#f97316" />
            <Text style={styles.detailText}>{date || 'March 25, 2026'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#f97316" />
            <Text style={styles.detailText}>{time || '10:30 AM'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#f97316" />
            <Text style={styles.detailText}>{panditName || 'Pandit G. Sharma'}</Text>
          </View>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>Next Steps:</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Wait for the Pandit to arrive at the scheduled time.</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Keep your puja samagri ready as recommended.</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>You can message the Pandit for any specific preparations.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push(`/(customer)/bookings/${bookingId}`)}
        >
          <Text style={styles.buttonText}>My Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.replace('/(customer)')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 30, alignItems: 'center', paddingTop: 60 },
  iconContainer: { marginBottom: 30 },
  successCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#10B981', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3E2723', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 35 },
  detailsCard: { 
    backgroundColor: '#fff', 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 35,
    borderWidth: 1,
    borderColor: '#eee'
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailText: { fontSize: 16, color: '#3E2723', marginLeft: 15, fontWeight: '500' },
  nextSteps: { width: '100%', paddingHorizontal: 10 },
  nextStepsTitle: { fontSize: 18, fontWeight: 'bold', color: '#3E2723', marginBottom: 20 },
  stepItem: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  stepNumber: { 
    width: 24, height: 24, borderRadius: 12, 
    backgroundColor: '#3E2723', justifyContent: 'center', alignItems: 'center',
    marginRight: 15, marginTop: 2
  },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepText: { flex: 1, fontSize: 15, color: '#666', lineHeight: 22 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  primaryButton: { 
    backgroundColor: '#f97316', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee', 
    alignItems: 'center' 
  },
  secondaryButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
});
