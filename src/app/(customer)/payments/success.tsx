import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#10B981" />
      </View>
      
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        Your booking has been confirmed. You can now track your appointment or message the Pandit.
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => router.push(`/(customer)/bookings/${bookingId}`)}
      >
        <Text style={styles.buttonText}>View Booking Details</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => router.replace('/(customer)')}
      >
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', padding: 30 },
  iconContainer: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3E2723', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#3E2723', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  primaryButton: { 
    backgroundColor: '#f97316', 
    width: '100%', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f97316', 
    width: '100%', 
    alignItems: 'center' 
  },
  secondaryButtonText: { color: '#f97316', fontSize: 16, fontWeight: '600' },
});
