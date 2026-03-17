import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useUser } from '@/store/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { getProfile } from '@/services/auth.service';
import { listBookings } from '@/services/booking.service';
import { getImageUrl } from '@/utils/image';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, updateUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const isDark = theme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    // Only fetch profile data if the user is authenticated
    if (!isAuthenticated) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [profileResponse, bookingsResponse] = await Promise.all([
          getProfile(),
          listBookings()
        ]);
        const profileData = profileResponse?.data || profileResponse;
        const bookingsRaw = bookingsResponse?.data || bookingsResponse;
        const bookingsData = Array.isArray(bookingsRaw) ? bookingsRaw : (bookingsRaw?.results || []);

        updateUser({
          name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone_number,
          role: profileData.role,
          photoUri: getImageUrl(profileData.profile_image),
        } as any);

        const pending = bookingsData.filter((b: any) => b.status === 'COMPLETED' && !b.is_reviewed);
        setPendingReviewCount(pending.length);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'np' : 'en';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/auth/welcome');
  };

  const handleEditPress = () => {
    router.push('/(customer)/edit-profile' as any);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      setLoading(true);
      await import('@/services/auth.service').then(m => m.deleteProfile());
      await logout();
      Alert.alert("Success", "Your account has been deleted.");
      router.replace('/auth/welcome');
    } catch (error: any) {
      console.error('Delete account error:', error);
      Alert.alert("Error", error.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={24} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.5 }} />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleEditPress} style={styles.imageContainer}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEditPress} style={styles.nameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}>{user?.email || user?.phone || 'Add contact info'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>CUSTOMER</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Personal Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Personal</Text>
          {renderSettingItem("person-outline", "Edit Profile", handleEditPress)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("planet-outline", "My Kundali", () => router.push('/(customer)/floating-kundali' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("heart-outline", "My Wishlist", () => router.push('/(customer)/wishlist' as any))}
        </View>

        {/* Activity & Feedback */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Feedback & Activity</Text>
          {renderSettingItem(
            "star-outline", 
            "Rate Pandits I Booked", 
            () => router.push('/(customer)/reviews/pending' as any),
            pendingReviewCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingReviewCount}</Text>
              </View>
            ) : null
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            "megaphone-outline", 
            "Rate the App (PanditYatra)", 
            () => Alert.alert("Rate App", "Redirecting to App Store...")
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            "chatbubble-ellipses-outline", 
            "My Reviews History", 
            () => router.push('/(customer)/reviews/history' as any)
          )}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Settings</Text>
          
          {renderSettingItem("notifications-outline", "Notifications", () => router.push('/(customer)/notifications' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="language" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Language</Text>
            </View>
            <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
              <Text style={[styles.langText, { color: colors.primary }]}>
                {i18n.language === 'en' ? 'English' : 'नेपाली'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="cash-outline" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Currency Preference</Text>
            </View>
            <Text style={{ color: colors.text, opacity: 0.5 }}>NPR (Default)</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support</Text>
          {renderSettingItem("help-circle-outline", "Help & Support", () => router.push('/(customer)/help' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("lock-closed-outline", "Privacy Policy", () => { })}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("document-text-outline", "Terms of Service", () => { })}
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Account Actions</Text>
          {renderSettingItem(
            "trash-outline", 
            "Delete Account", 
            () => setShowDeleteModal(true),
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" style={{ opacity: 0.5 }} />
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            "log-out-outline", 
            "Logout", 
            () => setShowLogoutModal(true),
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" style={{ opacity: 0.5 }} />
          )}
        </View>

        <View style={{ height: 100 }} />

        <LogoutModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />

        <DeleteAccountModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      </ScrollView>

      {/* Floating AI Guide Button */}
      <TouchableOpacity 
        style={[styles.floatingAiButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(customer)/ai-assistant' as any)}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  nameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  langButton: {
    padding: 8,
  },
  langText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
});
