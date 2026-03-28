import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuthStore();

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace('/(customer)');
  };

  const selectRole = (role: 'user' | 'pandit' | 'vendor') => {
    if (role === 'pandit') {
       router.push('/(auth)/pandit/login' as any);
    } else if (role === 'vendor') {
       router.push('/(auth)/vendor/login' as any);
    } else {
       router.push('/(auth)/user/login' as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        bounces={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={require('@/../assets/images/pandit-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.appName}>PanditYatra</Text>
          <Text style={styles.tagline}>Spiritual Services at Your Fingertips</Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.roleCard, { backgroundColor: '#FF6F00' }]} 
            onPress={() => selectRole('user')}
            activeOpacity={0.9}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={28} color="#FF6F00" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Join as Customer</Text>
              <Text style={styles.cardDesc}>Book Pandits, Puja, and Astrology</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleCard, { backgroundColor: '#374151' }]} 
            onPress={() => selectRole('pandit')}
            activeOpacity={0.9}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={28} color="#374151" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Join as Pandit</Text>
              <Text style={styles.cardDesc}>Register your services and grow</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleCard, { backgroundColor: '#1A6B3C' }]} 
            onPress={() => selectRole('vendor')}
            activeOpacity={0.9}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="store" size={28} color="#1A6B3C" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Join as Vendor</Text>
              <Text style={styles.cardDesc}>Sell Samagri, Books & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleCard, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB' }]} 
            onPress={handleGuestMode}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="eye" size={28} color="#6B7280" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.cardTitle, { color: '#111827' }]}>Explore as Guest</Text>
              <Text style={[styles.cardDesc, { color: '#6B7280' }]}>Browse services without an account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for Spirituality</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT - 60,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FF6F00',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  buttonSection: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
