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
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const RoleCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress, 
    isLast = false 
  }: { 
    title: string, 
    description: string, 
    icon: any, 
    color: string, 
    onPress: () => void,
    isLast?: boolean
  }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '10' }]}>
        {typeof icon === 'string' ? (
          <Ionicons name={icon as any} size={26} color={color} />
        ) : (
          <MaterialCommunityIcons name={icon.name} size={26} color={color} />
        )}
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/pandit-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.appName}>PanditYatra</Text>
          <Text style={styles.tagline}>Spiritual Services at Your Fingertips</Text>
        </View>

        {/* Selection Area */}
        <View style={styles.cardContainer}>
          <Text style={styles.selectionTitle}>Choose your role to continue</Text>
          
          <RoleCard 
            title="Join as Customer"
            description="Book Pandits, Puja, and Astrology"
            icon="person"
            color="#FF6F00"
            onPress={() => selectRole('user')}
          />

          <RoleCard 
            title="Join as Pandit"
            description="Register your services and grow"
            icon="school"
            color="#374151"
            onPress={() => selectRole('pandit')}
          />

          <RoleCard 
            title="Join as Vendor"
            description="Sell Samagri, Books & more"
            icon={{ name: 'store' }}
            color="#1A6B3C"
            onPress={() => selectRole('vendor')}
          />

          <RoleCard 
            title="Explore as Guest"
            description="Browse services without an account"
            icon="eye"
            color="#6B7280"
            onPress={handleGuestMode}
            isLast={true}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for Spirituality</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // zinc-50 equivalent
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF6F00',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  selectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6', // zinc-100
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
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
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
