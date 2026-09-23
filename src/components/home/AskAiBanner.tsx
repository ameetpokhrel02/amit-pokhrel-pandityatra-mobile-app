import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AskAiBannerProps {
  onPress: () => void;
}

export const AskAiBanner = ({ onPress }: AskAiBannerProps) => {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} accessibilityRole="button" accessibilityLabel="Ask AI Ritual Guide">
        <LinearGradient
          colors={['#F97316', '#EA580C', '#C2410C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Decorative circles */}
          <View style={[styles.circle, styles.circleLg]} />
          <View style={[styles.circle, styles.circleSm]} />

          <View style={styles.content}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={11} color="#FFF" />
              <Text style={styles.badgeText}>AI GUIDE</Text>
            </View>

            <Text style={styles.title}>Ask our AI Ritual Guide</Text>
            <Text style={styles.body}>
              Puja steps, muhurat, samagri lists and more — answered instantly.
            </Text>

            <View style={styles.cta}>
              <Text style={styles.ctaText}>Ask AI</Text>
              <Ionicons name="arrow-forward" size={14} color="#EA580C" />
            </View>
          </View>

          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="robot-happy-outline" size={44} color="#FFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, marginTop: 28 },
  card: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  circleLg: { width: 160, height: 160, right: -40, top: -50 },
  circleSm: { width: 80, height: 80, right: 70, bottom: -40 },
  content: { flex: 1, paddingRight: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 10, lineHeight: 24 },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 18, marginTop: 4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 14,
  },
  ctaText: { color: '#EA580C', fontWeight: '800', fontSize: 13 },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
