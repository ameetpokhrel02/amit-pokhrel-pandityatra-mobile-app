import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore, useUser } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile } from '@/services/auth.service';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, updateUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const isDark = theme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetchProfile();
        const data = res?.data || res;
        updateUser({
          name: data.full_name,
          email: data.email,
          phone: data.phone_number,
          role: data.role,
          photoUri: data.profile_image ? data.profile_image : null,
          isPanditVerified: data.pandit_profile?.is_verified
        } as any);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(public)/role-selection');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert("Account Deleted", "Your account has been queued for deletion.");
    logout();
    router.replace('/(public)/role-selection');
  };

  const handleEditPress = () => {
    Alert.alert("Edit Profile", "Coming soon: Professional profile editor");
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
          <Text style={[styles.title, { color: colors.text }]}>Pandit Profile</Text>
        </View>

        {/* Profile Header Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleEditPress} style={styles.imageContainer}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'P'}</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Pandit Ji'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: (user as any)?.isPanditVerified ? '#DCFCE7' : '#FEF3C7' }]}>
              <Ionicons name={(user as any)?.isPanditVerified ? "checkmark-circle" : "time"} size={14} color={(user as any)?.isPanditVerified ? '#166534' : '#92400E'} />
              <Text style={[styles.roleText, { color: (user as any)?.isPanditVerified ? '#166534' : '#92400E', marginLeft: 4 }]}>
                {(user as any)?.isPanditVerified ? 'VERIFIED PANDIT' : 'PENDING VERIFICATION'}
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Bio Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Professional Bio</Text>
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bioText, { color: colors.text }]}>
            Professional Pandit with 10+ years of experience in Vedic rituals, Pujas, and Astrological consultations. Specialized in Shanti Puja and Marriage ceremonies.
          </Text>
        </View>

        {/* Professional Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>4.8</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>124</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Pujas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>10y</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Exp</Text>
          </View>
        </View>

        {/* Professional Menu */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Professional Details</Text>
          {renderSettingItem("newspaper-outline", "Edit Profile Details", handleEditPress)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("sparkles-outline", "My Services", () => router.push('/(pandit)/services' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("star-outline", "My Reviews", () => router.push('/(pandit)/reviews' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("wallet-outline", "Earnings & Wallet", () => router.push('/(pandit)/earnings' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("document-lock-outline", "Certifications", () => { })}
        </View>

        {/* Activity & Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Activity & Settings</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="flash-outline" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Available for Booking</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderSettingItem("notifications-outline", "Notification Settings", () => { })}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="language" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Language</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>English</Text>
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

        {/* Support & Account */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support</Text>
          {renderSettingItem("help-circle-outline", "Help & Support", () => router.push('/(pandit)/help'))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("lock-closed-outline", "Privacy Policy", () => { })}
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Account Actions</Text>
          {renderSettingItem(
            "trash-outline", 
            "Delete Account", 
            () => {
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. All bookings and data will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", onPress: handleDeleteAccount, style: "destructive" }
                ]
              );
            },
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
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
