import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';

export const DailyPanchang = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.moreDetailsBtn, { backgroundColor: '#FF6F00' }]}
        onPress={() => router.push('/(customer)/panchang' as any)}
      >
        <Ionicons name="sparkles-outline" size={20} color="#FFF" />
        <Text style={styles.moreDetailsText}>View Detailed Horoscope & Panchang</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginVertical: 32,
  },
  moreDetailsBtn: {
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  moreDetailsText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
