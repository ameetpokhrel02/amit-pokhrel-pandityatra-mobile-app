import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useVendorDashboard } from '@/hooks/vendor/useVendorDashboard';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/image';

const StatCard = ({ icon, label, value, color, colors }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
      {icon}
    </View>
    <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
    </View>
  </View>
);

export default function VendorDashboard() {
  const insets = useSafeAreaInsets();
  const { 
    profile, stats, products, recentOrders, lowStockItems, 
    loading, refreshing, onRefresh, loadData, router 
  } = useVendorDashboard();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isVerified = profile?.is_verified;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, paddingBottom: 20 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text, opacity: 0.6 }]}>WELCOME BACK,</Text>
          <Text style={[styles.shopName, { color: colors.text }]}>
            {profile?.shop_name || profile?.full_name || 'Vendor'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.card, overflow: 'hidden' }]}
          onPress={() => router.push('/(vendor)/profile' as any)}
        >
          {profile?.profile_pic ? (
            <Image
              source={{ uri: getImageUrl(profile.profile_pic) || profile.profile_pic }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="business-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Pending Approval Banner */}
        {isVerified === false && (
          <View style={[styles.pendingBanner, { backgroundColor: isDark ? '#3B2200' : '#FEF3C7', borderColor: isDark ? '#4B3F2E' : '#F59E0B' }]}>
            <Ionicons name="time" size={22} color="#D97706" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: isDark ? '#E5D5C5' : '#92400E', fontWeight: 'bold', fontSize: 14 }}>Pending Verification</Text>
              <Text style={{ color: isDark ? '#D1BFA9' : '#B45309', fontSize: 12, marginTop: 2 }}>Your shop is under review by admin.</Text>
            </View>
          </View>
        )}

        {/* Balance Hero Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          </View>
          <Text style={styles.balanceAmount}>
            NPR {stats ? parseFloat(stats.current_balance || '0').toLocaleString() : '—'}
          </Text>
          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={() => router.push('/(vendor)/profile' as any)}
          >
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.payoutBtnText, { color: colors.primary }]}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} size="large" />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Ionicons name="cash-outline" size={22} color="#10B981" />}
                label="Revenue" value={`NPR ${stats?.total_revenue?.toLocaleString() ?? 0}`}
                color="#10B981" colors={colors}
              />
              <StatCard
                icon={<Ionicons name="receipt-outline" size={22} color="#3B82F6" />}
                label="Orders" value={stats?.total_orders ?? 0}
                color="#3B82F6" colors={colors}
              />
              <StatCard
                icon={<Ionicons name="cube-outline" size={22} color={colors.primary} />}
                label="Products" value={stats?.total_products ?? 0}
                color={colors.primary} colors={colors}
              />
              <StatCard
                icon={<Ionicons name="warning-outline" size={22} color="#F59E0B" />}
                label="Low Stock" value={stats?.low_stock_count ?? 0}
                color="#F59E0B" colors={colors}
              />
            </View>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Low Stock Alerts</Text>
                  <TouchableOpacity onPress={() => router.push('/(vendor)/products')}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {lowStockItems.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.stockItemCard, { backgroundColor: colors.card, borderColor: '#FF980040' }]}
                      onPress={() => router.push({ pathname: '/(vendor)/products/[id]' as any, params: { id: item.id } })}
                    >
                      <Image source={{ uri: getImageUrl(item.image) || item.image }} style={styles.stockImg} contentFit="cover" />
                      <View style={styles.stockInfo}>
                        <Text style={[styles.stockName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ color: '#FF9800', fontWeight: '800', fontSize: 11 }}>Only {item.stock_quantity} left</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recent Orders */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/(vendor)/orders')}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>View Orders</Text>
                </TouchableOpacity>
              </View>
              {recentOrders.length === 0 ? (
                <View style={[styles.recentEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.text + '60', fontWeight: '600' }}>No recent orders</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {recentOrders.map(order => (
                    <TouchableOpacity 
                      key={order.id} 
                      style={[styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push({ pathname: '/(vendor)/orders/[id]' as any, params: { id: order.id } })}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>Order #{order.id}</Text>
                        <Text style={[styles.activitySubtitle, { color: colors.text + '60' }]}>{order.customer_name} • NPR {order.total_amount}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.text + '30'} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Shop Management */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Management</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'Add Item', icon: 'add-circle-outline', color: '#F97316', path: '/(vendor)/products/new' },
              { label: 'Orders', icon: 'list-outline', color: '#6366F1', path: '/(vendor)/orders' },
              { label: 'My Listing', icon: 'briefcase-outline', color: '#10B981', path: '/(vendor)/products' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.quickItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(item.path as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.color + '10' }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Feedback Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 40 }}>
          <TouchableOpacity
            style={[
              styles.feedbackBanner,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => router.push('/(customer)/reviews/app-reviews' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.feedbackIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Image
                  source={require('@/assets/images/pandit-logo.png')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>Love PanditYatra?</Text>
                <Text style={[styles.feedbackSubtitle, { color: colors.text + '80' }]}>Share your feedback with us</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '50'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
  },
  greeting: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  shopName: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  headerBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', margin: 20,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  balanceCard: {
    margin: 20, borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 16 },
  payoutBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  payoutBtnText: { fontWeight: 'bold', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
  statCard: { width: '47%', padding: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statInfo: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, opacity: 0.6, fontWeight: '600' },
  sectionContainer: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  stockItemCard: { width: 140, borderRadius: 18, borderWidth: 1, padding: 10, gap: 8 },
  stockImg: { width: '100%', height: 90, borderRadius: 12 },
  stockInfo: { gap: 2 },
  stockName: { fontSize: 13, fontWeight: '700' },
  recentEmpty: { padding: 20, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontSize: 14, fontWeight: '700' },
  activitySubtitle: { fontSize: 12, marginTop: 2 },
  quickActionsContainer: { marginTop: 30, paddingHorizontal: 20 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickItem: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 12 },
  quickIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, borderWidth: 1 },
  feedbackIconWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  feedbackTitle: { fontSize: 16, fontWeight: '800' },
  feedbackSubtitle: { fontSize: 12 },
});
