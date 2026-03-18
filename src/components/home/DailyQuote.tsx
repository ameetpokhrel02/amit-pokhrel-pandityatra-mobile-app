import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { useTheme } from '@/store/ThemeContext';

const QUOTES = [
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Yoga is the journey of the self, through the self, to the self.", author: "Bhagavad Gita" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "Perform your obligatory duty, because action is indeed better than inaction.", author: "Bhagavad Gita" },
];

export const DailyQuote = () => {
  // Simple random quote for now
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      <View style={styles.quoteIcon}>
        <Ionicons name="chatbox-ellipses" size={24} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.quoteText}>"{quote.text}"</Text>
      <Text style={styles.authorText}>- {quote.author}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    opacity: 0.2,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: '500',
  },
  authorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
