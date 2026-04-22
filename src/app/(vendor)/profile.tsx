import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { getVendorProfile, listPayouts, requestPayout, VendorProfile, VendorPayout } from '@/services/vendor.service';
import { getImageUrl } from '@/utils/image';

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9800', PAID: '#4CAF50', REJECTED: '#F44336',
};

export default function VendorProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, theme, setMode } = useTheme();
  const { user, logout } = useAuthStore();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = async () => {
    try {
      const [profileRes, payoutsRes] = await Promise.all([getVendorProfile(), listPayouts()]);
      const profileData = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
      setProfile(profileData);
      const pData = payoutsRes.data?.results || payoutsRes.data;
      setPayouts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error('Failed to load vendor profile:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    const balance = parseFloat(profile?.balance || '0');
    if (amount > balance) {
      Alert.alert('Insufficient Balance', `Your current balance is NPR ${balance}.`);
      return;
    }
    
    Alert.alert('Request Payout', `Request NPR ${amount} payout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setRequesting(true);
            await requestPayout(amount);
            setPayoutAmount('');
            Alert.alert('✅ Payout Requested', 'Your payout request has been submitted for admin processing.');
            await load();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Failed to request payout.');
          } finally { setRequesting(false); }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(public)/role-selection');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    // In a real app, this would call a delete account service
    Alert.alert("Account Deleted", "Your account has been queued for deletion.");
    logout();
    router.replace('/(public)/role-selection');
  };

  const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={22} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={18} color={colors.text} style={{ opacity: 0.3 }} />}
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Shop Profile</Text>
        </View>

        {/* Profile Header Section */}
        <View style={styles.profileSection}>
            <View style={[styles.imageContainer, { backgroundColor: colors.primary + '15' }]}>
              {profile?.profile_pic ? (
                <Image
                  source={{ uri: getImageUrl(profile.profile_pic) || profile.profile_pic }}
                  style={styles.profilePic}
                  contentFit="cover"
                />
              ) : (
                <MaterialCommunityIcons name="store" size={40} color={colors.primary} />
              )}
            </View>
            <View style={styles.nameContainer}>
                <Text style={[styles.userName, { color: colors.text }]}>{profile?.shop_name || user?.name || 'Vendor'}</Text>
                <View style={[styles.roleBadge, { backgroundColor: profile?.is_verified ? '#DCFCE7' : '#FEF3C7' }]}>
                    <Ionicons name={profile?.is_verified ? "checkmark-circle" : "time"} size={14} color={profile?.is_verified ? '#166534' : '#92400E'} />
                    <Text style={[styles.roleText, { color: profile?.is_verified ? '#166534' : '#92400E', marginLeft: 4 }]}>
                        {profile?.is_verified ? 'VERIFIED VENDOR' : 'PENDING VERIFICATION'}
                    </Text>
                </View>
            </View>
        </View>

        {/* Professional Details Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Professional Details</Text>
          {renderSettingItem("newspaper-outline", "Edit Shop Details", () => {})}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("sparkles-outline", "My Products", () => router.push('/(vendor)/products' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("star-outline", "My Reviews", () => {})}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("wallet-outline", "Earnings & Wallet", () => {})}
        </View>

        {/* Shop Information Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Shop Information</Text>
          <InfoRow icon="person-outline" label="Owner" value={profile?.full_name || user?.name} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="mail-outline" label="Email" value={profile?.email || user?.email} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="location-outline" label="Location" value={profile?.city} colors={colors} />
        </View>

        {/* Bank Details Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Bank Details</Text>
          <InfoRow icon="card-outline" label="Account" value={profile?.bank_account_number ? '••••' + profile.bank_account_number.slice(-4) : '—'} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="business-outline" label="Bank" value={profile?.bank_name} colors={colors} />
        </View>

        {/* Wallet & Payout Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Wallet & Payouts</Text>
          
          <View style={[styles.balanceRow, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
            <Text style={[styles.balanceLabel, { color: colors.text }]}>Available Balance</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
                NPR {parseFloat(profile?.balance || '0').toLocaleString()}
            </Text>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F9FAFB', borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.text + '40'}
              keyboardType="decimal-pad"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
            />
            <TouchableOpacity 
              style={[styles.payoutActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleRequestPayout}
              disabled={requesting}
            >
              {requesting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.payoutActionBtnText}>Withdraw</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support</Text>
          {renderSettingItem("help-circle-outline", "Help & Support", () => {})}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("bug-outline", "Report a Bug", () => router.push('/support/bug-report'))}
        </View>

        {/* Account Actions Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Account Actions</Text>
          {renderSettingItem("moon-outline", "Dark Mode", () => setMode(isDark ? 'light' : 'dark'), 
                <TouchableOpacity onPress={() => setMode(isDark ? 'light' : 'dark')}>
                    <Ionicons name={isDark ? "toggle" : "toggle-outline"} size={32} color={isDark ? colors.primary : colors.text} />
                </TouchableOpacity>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {renderSettingItem(
                "trash-outline", 
                "Delete Account", 
                () => setShowDeleteModal(true),
                <Ionicons name="chevron-forward" size={18} color="#FF3B30" style={{ opacity: 0.5 }} />
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {renderSettingItem(
                "log-out-outline", 
                "Logout", 
                () => setShowLogoutModal(true), 
                <Ionicons name="chevron-forward" size={18} color="#FF3B30" style={{ opacity: 0.5 }} />
            )}
        </View>

        {/* App Feedback Section */}
        <View style={{ marginTop: 12, marginBottom: 40 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 20, borderRadius: 24, borderWidth: 1, backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0'
            }}
            onPress={() => router.push('/(customer)/reviews/app-reviews' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary + '20', overflow: 'hidden' }}>
                <Image
                  source={require('@/assets/images/pandit-logo.png')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 2, color: colors.text }}>Love PanditYatra?</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text + '80' }}>Share your feedback with us</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '50'} />
          </TouchableOpacity>
        </View>

        <ConfirmationModal
            visible={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
            title="Logout?"
            message="Are you sure you want to logout from PanditYatra?"
            confirmText="Yes, Logout"
            type="warning"
            icon="log-out"
        />

        <ConfirmationModal
            visible={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteAccount}
            title="Delete Account?"
            message="This action is permanent and cannot be undone. All your shop data, products, and earnings history will be lost."
            confirmText="Delete Permanently"
            type="danger"
            icon="trash-bin"
        />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={20} color={colors.text} style={{ opacity: 0.6 }} />
        <Text style={[styles.infoLabel, { color: colors.text, opacity: 0.6 }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profilePic: { width: '100%', height: '100%' },
  nameContainer: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  section: { borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginVertical: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '60%' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 16 },
  balanceLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  balanceValue: { fontSize: 18, fontWeight: 'bold' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, fontSize: 16, height: 44 },
  payoutActionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  payoutActionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
