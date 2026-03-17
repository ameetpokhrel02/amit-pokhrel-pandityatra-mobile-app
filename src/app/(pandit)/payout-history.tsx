import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { fetchWalletBalance } from '@/services/pandit.service';
import dayjs from 'dayjs';

export default function PayoutHistoryScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const wallet = await fetchWalletBalance();
      setTransactions(wallet.recent_transactions || []);
    } catch (error) {
      console.error('Error loading payout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderTxItem = ({ item }: { item: any }) => (
    <View style={[styles.txCard, { backgroundColor: colors.card, borderLeftColor: item.type === 'EARNING' ? '#16A34A' : '#EF4444' }]}>
      <View style={styles.txMain}>
        <View>
          <Text style={[styles.txTitle, { color: colors.text }]}>
            {item.type === 'EARNING' ? 'Puja Earnings' : 'Withdrawal'}
          </Text>
          <Text style={[styles.txDate, { color: colors.text + '60' }]}>
            {dayjs(item.timestamp).format('MMM D, YYYY • hh:mm A')}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: item.type === 'EARNING' ? '#16A34A' : '#EF4444' }]}>
          {item.type === 'EARNING' ? '+' : '-'} NPR {item.amount}
        </Text>
      </View>
      <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.statusLabel, { color: colors.text + '40' }]}>Status: </Text>
        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'COMPLETED' || item.type === 'EARNING') ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: (item.status === 'COMPLETED' || item.type === 'EARNING') ? '#166534' : '#92400E' }]}>
            {item.status || 'Success'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payout History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTxItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.text + '20'} />
              <Text style={[styles.emptyText, { color: colors.text + '40' }]}>No transaction history found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  txCard: { 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 16, 
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  txMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  txTitle: { fontSize: 16, fontWeight: 'bold' },
  txDate: { fontSize: 12, marginTop: 4 },
  txAmount: { fontSize: 18, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  statusLabel: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '500' },
});
