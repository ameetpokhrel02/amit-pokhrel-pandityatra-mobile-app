import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PaymentFailureScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={100} color="#EF4444" />
      </View>
      
      <Text style={styles.title}>Payment Failed</Text>
      <Text style={styles.subtitle}>
        Something went wrong with your transaction. Please check your payment details and try again.
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => router.replace('/(customer)/chat/ai-guide')}
      >
        <Text style={styles.secondaryButtonText}>Contact Support</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.textButton}
        onPress={() => router.replace('/(customer)')}
      >
        <Text style={styles.textButtonText}>Cancel & Go Home</Text>
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
    alignItems: 'center',
    marginBottom: 20
  },
  secondaryButtonText: { color: '#f97316', fontSize: 16, fontWeight: '600' },
  textButton: { padding: 10 },
  textButtonText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },
});
