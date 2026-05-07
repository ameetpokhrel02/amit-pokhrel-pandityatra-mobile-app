import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_ROLE_KEY = 'recent_selected_role';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuthStore();
  const [recentRole, setRecentRole] = React.useState<'user' | 'pandit' | 'vendor' | null>(null);

  React.useEffect(() => {
    const loadRecentRole = async () => {
      try {
        const value = await AsyncStorage.getItem(RECENT_ROLE_KEY);
        if (value === 'user' || value === 'pandit' || value === 'vendor') {
          setRecentRole(value);
        }
      } catch {
        // Ignore storage read failures to keep role selection usable.
      }
    };

    loadRecentRole();
  }, []);

  const saveRecentRole = async (role: 'user' | 'pandit' | 'vendor') => {
    try {
      await AsyncStorage.setItem(RECENT_ROLE_KEY, role);
      setRecentRole(role);
    } catch {
      // Ignore storage write failures to avoid blocking navigation.
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace('/(customer)');
  };

  const selectRole = (role: 'user' | 'pandit' | 'vendor') => {
    saveRecentRole(role);
    if (role === 'pandit') {
       router.push('/(auth)/pandit/login' as any);
    } else if (role === 'vendor') {
       router.push('/(auth)/vendor/login' as any);
    } else {
       router.push('/(auth)/user/login' as any);
    }
  };

  const roles: Array<{
    id: 'user' | 'pandit' | 'vendor';
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = [
    {
      id: 'user',
      title: 'Join as Customer',
      description: 'Book Pandits, Puja, and Astrology',
      icon: 'person-outline',
      color: '#F97316',
    },
    {
      id: 'pandit',
      title: 'Join as Pandit',
      description: 'Register your services and grow',
      icon: 'school-outline',
      color: '#2563EB',
    },
    {
      id: 'vendor',
      title: 'Join as Vendor',
      description: 'Sell Samagri, Books and essentials',
      icon: 'storefront-outline',
      color: '#15803D',
    },
  ];

  const RoleCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress, 
    isRecent = false,
  }: { 
    title: string, 
    description: string, 
    icon: keyof typeof Ionicons.glyphMap,
    color: string, 
    onPress: () => void,
    isRecent?: boolean,
  }) => (
    <TouchableOpacity 
      style={[styles.card, isRecent && styles.recentCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}> 
        <Ionicons name={icon} size={23} color={color} />
      </View>

      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {isRecent ? (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>Recent</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSubtitle}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
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
          <Text style={styles.flowHint}>Select your account type</Text>
        </View>

        {/* Selection Area */}
        <View style={styles.cardContainer}>
          <Text style={styles.selectionTitle}>Choose your role to continue</Text>

          {roles.map((role) => (
            <RoleCard
              key={role.id}
              title={role.title}
              description={role.description}
              icon={role.icon}
              color={role.color}
              onPress={() => selectRole(role.id)}
              isRecent={recentRole === role.id}
            />
          ))}

          <RoleCard 
            title="Explore as Guest"
            description="Browse services without an account"
            icon="compass-outline"
            color="#6B7280"
            onPress={handleGuestMode}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made for Spirituality</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logo: {
    width: 82,
    height: 82,
    marginBottom: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FF6F00',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  flowHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '700',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  selectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
    textAlign: 'left',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recentCard: {
    borderColor: '#FFD7B3',
    backgroundColor: '#FFF9F3',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  recentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFEDD5',
  },
  recentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
