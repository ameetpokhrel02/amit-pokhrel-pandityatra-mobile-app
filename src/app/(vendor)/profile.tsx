import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { getVendorProfile, listPayouts, requestPayout, VendorProfile, VendorPayout } from '@/services/vendor.service';

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9800', PAID: '#4CAF50', REJECTED: '#F44336',
};

export default function VendorProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user, logout } = useAuthStore();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

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

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Shop Profile</Text>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#FF5252' + '15' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Shop Identity Card */}
        <View style={[styles.shopCard, { backgroundColor: colors.primary }]}>
          <View style={styles.shopIconWrap}>
            <MaterialCommunityIcons name="store" size={32} color={colors.primary} />
          </View>
          <Text style={styles.shopName}>{profile?.shop_name || user?.name}</Text>
          <Text style={styles.shopType}>{profile?.business_type}</Text>
          <View style={[styles.verifiedBadge, { backgroundColor: profile?.is_verified ? '#4CAF5030' : '#FF980030' }]}>
            <Ionicons name={profile?.is_verified ? 'checkmark-circle' : 'time-outline'} size={14} color={profile?.is_verified ? '#4CAF50' : '#FF9800'} />
            <Text style={{ color: profile?.is_verified ? '#4CAF50' : '#FF9800', fontSize: 12, fontWeight: '800' }}>
              {profile?.is_verified ? 'Verified Vendor' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Shop Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Information</Text>
          <InfoRow icon="person-outline" label="Owner" value={profile?.full_name || user?.name} colors={colors} />
          <InfoRow icon="mail-outline" label="Email" value={profile?.email || user?.email} colors={colors} />
          <InfoRow icon="location-outline" label="Location" value={profile?.city} colors={colors} />
          <InfoRow icon="map-outline" label="Address" value={profile?.address} colors={colors} />
        </View>

        {/* Bank Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bank Details</Text>
          <InfoRow icon="card-outline" label="Account" value={profile?.bank_account_number ? '••••' + profile.bank_account_number.slice(-4) : '—'} colors={colors} />
          <InfoRow icon="business-outline" label="Bank" value={profile?.bank_name} colors={colors} />
          <InfoRow icon="person-outline" label="Holder" value={profile?.account_holder_name} colors={colors} />
        </View>

        {/* Balance & Payout */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Wallet & Payouts</Text>

          <View style={[styles.balanceRow, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
            <Text style={[styles.balanceLabel, { color: colors.text }]}>Available Balance</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              NPR {parseFloat(profile?.balance || '0').toLocaleString()}
            </Text>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F9FAFB', borderColor: isDark ? '#333' : '#E5E7EB' }]}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter payout amount"
              placeholderTextColor={colors.text + '50'}
              keyboardType="decimal-pad"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.payoutBtn, { backgroundColor: colors.primary }, requesting && { opacity: 0.7 }]}
            onPress={handleRequestPayout}
            disabled={requesting}
          >
            {requesting ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="wallet-outline" size={18} color="#FFF" /><Text style={styles.payoutBtnText}>Request Payout</Text></>
            )}
          </TouchableOpacity>
        </View>

        {/* Payout History */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payout History</Text>
          {payouts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text + '50' }]}>No payout requests yet.</Text>
          ) : payouts.map(p => (
            <View key={p.id} style={[styles.payoutRow, { borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
              <View>
                <Text style={[styles.payoutAmount, { color: colors.text }]}>NPR {parseFloat(p.amount).toLocaleString()}</Text>
                <Text style={[styles.payoutDate, { color: colors.text + '50' }]}>
                  {new Date(p.requested_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.payoutStatus, { backgroundColor: (PAYOUT_STATUS_COLORS[p.status] || '#888') + '20' }]}>
                <Text style={{ color: PAYOUT_STATUS_COLORS[p.status] || '#888', fontWeight: '800', fontSize: 11 }}>{p.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ width: 20 }} />
      <Text style={[styles.infoLabel, { color: colors.text + '60' }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '900' },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 16 },
  shopCard: { borderRadius: 28, padding: 28, alignItems: 'center', gap: 8 },
  shopIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  shopName: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  shopType: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  section: { borderRadius: 20, padding: 18, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { width: 54, fontSize: 12, fontWeight: '700' },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  balanceLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  balanceValue: { fontSize: 18, fontWeight: '900' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontSize: 15 },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  payoutBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  payoutAmount: { fontSize: 15, fontWeight: '800' },
  payoutDate: { fontSize: 11, marginTop: 2 },
  payoutStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
