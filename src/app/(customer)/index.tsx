import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useCart } from '@/store/CartContext';
import { useUser } from '@/store/UserContext';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';
import { DailyPanchang } from '@/components/home/DailyPanchang';
import { useTranslation } from 'react-i18next';
import { fetchServices } from '@/services/booking.service';
import { Service } from '@/services/api';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedServices();
  }, []);

  const loadFeaturedServices = async () => {
    try {
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock upcoming booking
  const upcomingBooking = {
    id: 'bk_123',
    service: 'Satyanarayan Puja',
    date: '2024-03-15',
    time: '09:00 AM',
    pandit: 'Pt. Sharma',
    status: 'confirmed'
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(customer)/profile')}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.profileInitials}>{user?.name?.[0]?.toUpperCase() || 'G'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.greetingSection}
        >
          <Text style={[styles.greetingTitle, { color: colors.text }]}>{t('welcome')}, {user?.name || 'Guest'}!</Text>
          <Text style={[styles.greetingSubtitle, { color: isDark ? '#AAA' : '#666' }]}>{t('greetingSubtitle')}</Text>
        </MotiView>

        {/* Daily Panchang Widget */}
        <DailyPanchang />

        {/* Featured Services */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Services</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {services.map((service, index) => (
                <MotiView
                  key={service.id}
                  from={{ opacity: 0, scale: 0.9, translateY: 10 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  transition={{ delay: index * 100, type: 'timing', duration: 400 }}
                >
                  <TouchableOpacity
                    style={[styles.serviceCard, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/(customer)/services/${service.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.serviceIcon, { backgroundColor: isDark ? '#2D2D2D' : '#FFF7F0' }]}>
                      {service.image ? (
                        <Image
                          source={{ uri: service.image }}
                          style={styles.serviceImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.fallbackIcon, { backgroundColor: colors.primary + '10' }]}>
                          <Ionicons name="flame-outline" size={32} color={colors.primary} />
                          <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4, fontWeight: 'bold' }}>Puja</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
                        {service.name}
                      </Text>
                      <View style={styles.priceBadge}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                          NPR {service.base_price}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Upcoming Booking Card */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Booking</Text>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            style={[styles.bookingCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
          >
            <View style={styles.bookingHeader}>
              <View>
                <Text style={[styles.bookingService, { color: colors.text }]}>{upcomingBooking.service}</Text>
                <Text style={[styles.bookingPandit, { color: isDark ? '#AAA' : '#666' }]}>with {upcomingBooking.pandit}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.statusText, { color: '#2E7D32' }]}>{upcomingBooking.status}</Text>
              </View>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.bookingDetailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[styles.bookingDetailText, { color: colors.text }]}>{upcomingBooking.date}</Text>
              </View>
              <View style={styles.bookingDetailItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.bookingDetailText, { color: colors.text }]}>{upcomingBooking.time}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.viewBookingButton, { borderColor: colors.primary }]}>
              <Text style={[styles.viewBookingText, { color: colors.primary }]}>View Details</Text>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionData
              title="Book Puja"
              icon="flame"
              color="#FF9800"
              onPress={() => router.push('/(customer)/services')}
              colors={colors}
              isDark={isDark}
            />
            <QuickActionData
              title="Shop Samagri"
              icon="basket"
              color="#2196F3"
              onPress={() => router.push('/(customer)/shop')}
              colors={colors}
              isDark={isDark}
            />
            <QuickActionData
              title="Generate Kundali"
              icon="planet"
              color="#9C27B0"
              onPress={() => router.push('/(customer)/kundali')}
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function QuickActionData({ title, icon, color, onPress, colors, isDark }: any) {
  return (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={32} color={color} />
      </View>
      <Text style={[styles.quickActionTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileInitials: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  horizontalList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  serviceCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginRight: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceIcon: {
    width: '100%',
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  fallbackIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bookingCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingService: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingPandit: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewBookingButton: {
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBookingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    aspectRatio: 1, // Make it square-ish
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
