import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useUser } from '@/store/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { fetchProfile } from '@/services/auth.service';
import { fetchMyBookings } from '@/services/booking.service';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, updateUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileData, bookingsData] = await Promise.all([
          fetchProfile(),
          fetchMyBookings()
        ]);

        updateUser({
          name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone_number,
          role: profileData.role,
          photoUri: profileData.profile_image ? profileData.profile_image : null,
        } as any);

        const pending = bookingsData.filter(b => b.status === 'COMPLETED' && !b.is_reviewed);
        setPendingReviewCount(pending.length);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
              <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          )}
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}>{user?.email || 'email@example.com'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.darkMode')}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="language" size={24} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.language')}</Text>
          </View>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
            <Text style={[styles.langText, { color: colors.primary }]}>
              {i18n.language === 'en' ? 'English' : 'नेपाली'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reviews & Feedback Section */}
      <View style={[styles.section, { backgroundColor: colors.card, marginTop: 10 }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Reviews & Feedback</Text>
        
        {renderSettingItem(
          "star-outline", 
          "Rate Recent Services", 
          () => router.push('/(customer)/reviews/pending' as any),
          pendingReviewCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingReviewCount}</Text>
            </View>
          ) : null
        )}
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {renderSettingItem(
          "chatbubble-ellipses-outline", 
          "My Past Reviews", 
          () => router.push('/(customer)/reviews/history' as any)
        )}
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {renderSettingItem(
          "heart-outline", 
          "Rate PanditYatra", 
          () => router.push('/(customer)/reviews/platform-feedback' as any)
        )}
      </View>

      {/* More Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        {renderSettingItem("notifications-outline", "Notifications", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("lock-closed-outline", "Privacy Policy", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("document-text-outline", "Terms of Service", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("help-circle-outline", "Help & Support", () => { })}
      </View>

      {/* Account Section - Based on User Screenshot */}
      <Text style={[styles.sectionHeaderTitle, { color: colors.text + '80' }]}>Account</Text>
      <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#F3F4F6', paddingTop: 8, paddingBottom: 8 }]}>
        {renderSettingItem(
          "trash-outline", 
          "Delete account", 
          () => Alert.alert("Delete Account", "Are you sure you want to delete your account? This action is irreversible.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => Alert.alert("Requested", "Account deletion request submitted.") }
          ], { cancelable: true }),
          <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
        )}
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />
        {renderSettingItem(
          "log-out-outline", 
          "Logout", 
          () => setShowLogoutModal(true),
          <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
        )}
      </View>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </ScrollView>
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
});
