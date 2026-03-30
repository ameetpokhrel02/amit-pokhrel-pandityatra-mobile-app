import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useVendorDashboard } from '@/hooks/vendor/useVendorDashboard';

const StatCard = ({ icon, label, value, color, isDark, colors }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.text + '70' }]}>{label}</Text>
  </View>
);

export default function VendorDashboard() {
  const insets = useSafeAreaInsets();
  const { user, stats, loading, refreshing, onRefresh, router } = useVendorDashboard();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const isVerified = user?.vendor_profile?.is_verified;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text + '70' }]}>Welcome back,</Text>
          <Text style={[styles.shopName, { color: colors.text }]}>
            {user?.vendor_profile?.shop_name || user?.name || 'Vendor'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: isDark ? '#2A2A2E' : '#F4F4F5' }]}
            onPress={() => router.push('/(vendor)/profile' as any)}
          >
            <MaterialCommunityIcons name="store-cog-outline" size={22} color={colors.text + 'B0'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Pending Approval Banner */}
        {isVerified === false && (
          <View style={[styles.pendingBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFD700' }]}>
            <Ionicons name="time-outline" size={20} color="#B8860B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#7D6608', fontWeight: '800', fontSize: 14 }}>Pending Admin Verification</Text>
              <Text style={{ color: '#7D6608', fontSize: 12, marginTop: 2 }}>Your shop is under review. Full features unlock after approval.</Text>
            </View>
          </View>
        )}

        {/* Balance Hero Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="cash-multiple" size={32} color="rgba(255,255,255,0.6)" />
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            NPR {stats ? parseFloat(stats.current_balance || '0').toLocaleString() : '—'}
          </Text>
          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={() => router.push('/(vendor)/profile' as any)}
          >
            <Ionicons name="wallet-outline" size={14} color={colors.primary} />
            <Text style={[styles.payoutBtnText, { color: colors.primary }]}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} size="large" />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon={<MaterialCommunityIcons name="currency-usd" size={22} color="#4CAF50" />}
              label="Total Revenue" value={`NPR ${stats?.total_revenue?.toLocaleString() ?? 0}`}
              color="#4CAF50" isDark={isDark} colors={colors}
            />
            <StatCard
              icon={<Ionicons name="receipt-outline" size={22} color="#2196F3" />}
              label="Total Orders" value={stats?.total_orders ?? 0}
              color="#2196F3" isDark={isDark} colors={colors}
            />
            <StatCard
              icon={<MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primary} />}
              label="Products" value={stats?.total_products ?? 0}
              color={colors.primary} isDark={isDark} colors={colors}
            />
            <StatCard
              icon={<Ionicons name="warning-outline" size={22} color="#FF9800" />}
              label="Low Stock" value={stats?.low_stock_count ?? 0}
              color="#FF9800" isDark={isDark} colors={colors}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {[
              { label: 'Add Product', icon: 'plus-box-outline', color: colors.primary, path: '/(vendor)/products/new' },
              { label: 'View Orders', icon: 'receipt-outline', color: '#2196F3', path: '/(vendor)/orders/index' },
              { label: 'My Products', icon: 'package-variant-closed', color: '#4CAF50', path: '/(vendor)/products/index' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.quickItem, { backgroundColor: item.color + '15' }]}
                onPress={() => router.push(item.path as any)}
              >
                <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                <Text style={[styles.quickLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'transparent',
  },
  greeting: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  shopName: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  balanceCard: {
    margin: 16, borderRadius: 28, padding: 28, alignItems: 'center', gap: 6,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  payoutBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8,
  },
  payoutBtnText: { fontWeight: '800', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  statCard: { width: '46%', flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  quickActions: { margin: 16, borderRadius: 24, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8, padding: 16, borderRadius: 16 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
