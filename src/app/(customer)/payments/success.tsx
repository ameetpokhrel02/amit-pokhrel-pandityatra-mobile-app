import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/store/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import { LazyLoader } from '@/components/ui/LazyLoader';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { bookingId, method, amount } = useLocalSearchParams<{ bookingId: string, method?: string, amount?: string }>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const getMethodLogo = () => {
    switch (method?.toLowerCase()) {
      case 'khalti':
        return require('@/assets/images/khalti.png');
      case 'esewa':
        return require('@/assets/images/eswa.jpg');
      case 'stripe':
      case 'card':
        return null; // Will use icon
      default:
        return null;
    }
  };

  const logo = getMethodLogo();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.animationContainer}>
          <LazyLoader height={200}>
            <LottieAnimation
              source={require('@/assets/animations/success.json')}
              autoPlay
              loop={false}
              style={styles.lottie}
            />
          </LazyLoader>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Payment Successful!</Text>
          <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
            Your booking #{bookingId} has been confirmed.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.methodRow}>
            <Text style={[styles.label, { color: colors.text, opacity: 0.6 }]}>Payment Method</Text>
            <View style={styles.methodBadge}>
              {logo ? (
                <Image source={logo} style={styles.methodLogo} contentFit="contain" />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="credit-card-outline" size={20} color={colors.primary} />
                </View>
              )}
              <Text style={[styles.methodText, { color: colors.text }]}>
                {method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Digital Payment'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text, opacity: 0.6 }]}>Amount Paid</Text>
            <Text style={[styles.amountText, { color: colors.primary }]}>NPR {amount || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text, opacity: 0.6 }]}>Booking ID</Text>
            <Text style={[styles.valueText, { color: colors.text }]}>#{bookingId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text, opacity: 0.6 }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.statusText}>COMPLETED</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(customer)/bookings')}
          >
            <Text style={styles.buttonText}>My Bookings</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.replace('/(customer)')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  animationContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 250,
    height: 250,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  card: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
  footer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
