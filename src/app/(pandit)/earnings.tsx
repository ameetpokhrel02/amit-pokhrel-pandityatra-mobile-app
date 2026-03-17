import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { fetchWalletBalance, requestWithdrawal, fetchPanditDashboardStats } from '@/services/pandit.service';
import { Button } from '@/components/ui/Button';
import dayjs from 'dayjs';

export default function EarningsScreen() {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    
    // Withdrawal state
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, walletData] = await Promise.all([
                fetchPanditDashboardStats(),
                fetchWalletBalance()
            ]);
            setStats(statsData);
            setWallet(walletData);
        } catch (error) {
            console.error('Error loading earnings data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
            return;
        }
        if (amount > (wallet?.balance || 0)) {
            Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current balance.');
            return;
        }
        if (!bankDetails.trim()) {
            Alert.alert('Required', 'Please enter your bank/payment details.');
            return;
        }

        try {
            setSubmitting(true);
            await requestWithdrawal({ amount, bank_details: bankDetails });
            Alert.alert('Success', 'Your withdrawal request has been submitted and is pending approval.');
            setShowWithdrawForm(false);
            setWithdrawAmount('');
            setBankDetails('');
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit withdrawal request.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings & Wallet</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Wallet Balance Card */}
                <View style={[styles.walletCard, { backgroundColor: '#FF6F00' }]}>
                    <Text style={styles.walletLabel}>Available Balance</Text>
                    <Text style={styles.walletBalance}>NPR {wallet?.balance || '0.00'}</Text>
                    <TouchableOpacity 
                        style={styles.withdrawToggle}
                        onPress={() => setShowWithdrawForm(!showWithdrawForm)}
                    >
                        <Text style={styles.withdrawToggleText}>
                            {showWithdrawForm ? 'Cancel Request' : 'Request Withdrawal'}
                        </Text>
                        <Ionicons name={showWithdrawForm ? "close-circle" : "arrow-forward-circle"} size={20} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                {showWithdrawForm && (
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.formTitle, { color: colors.text }]}>Withdrawal Request</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Amount (NPR)</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? '#333' : '#F9F9F9', color: colors.text }]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#777' : '#999'}
                                keyboardType="numeric"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Bank / Account Details</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? '#333' : '#F9F9F9', color: colors.text, height: 80 }]}
                                placeholder="Bank Name, Account Number, etc."
                                placeholderTextColor={isDark ? '#777' : '#999'}
                                multiline
                                textAlignVertical="top"
                                value={bankDetails}
                                onChangeText={setBankDetails}
                            />
                        </View>

                        <Button 
                            title={submitting ? "Submitting..." : "Submit Request"}
                            onPress={handleWithdrawRequest}
                            isLoading={submitting}
                        />
                    </View>
                )}

                {/* Statistics Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#666' }]}>Total Bookings</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.total_bookings || 0}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#666' }]}>Completed</Text>
                        <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats?.completed_bookings || 0}</Text>
                    </View>
                     <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#666' }]}>Total Earnings</Text>
                        <Text style={[styles.statValue, { color: '#FF6F00' }]}>NPR {stats?.total_earnings || 0}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#666' }]}>Pending</Text>
                        <Text style={[styles.statValue, { color: '#D97706' }]}>{stats?.pending_bookings || 0}</Text>
                    </View>
                </View>

                {/* Transaction History Placeholder */}
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Transactions</Text>
                    <TouchableOpacity onPress={() => router.push('/(pandit)/payout-history' as any)}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>See All</Text>
                    </TouchableOpacity>
                </View>
                
                {wallet?.recent_transactions?.length > 0 ? (
                    wallet.recent_transactions.map((tx: any) => (
                        <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#EEE' }]}>
                            <View>
                                <Text style={[styles.txTitle, { color: colors.text }]}>{tx.type === 'EARNING' ? 'Booking Completion' : 'Withdrawal'}</Text>
                                <Text style={styles.txDate}>{dayjs(tx.timestamp).format('MMM D, YYYY')}</Text>
                            </View>
                            <Text style={[styles.txAmount, { color: tx.type === 'EARNING' ? '#16A34A' : '#DC2626' }]}>
                                {tx.type === 'EARNING' ? '+' : '-'} NPR {tx.amount}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={48} color={isDark ? '#444' : '#DDD'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#666' : '#AAA' }]}>No recent transactions</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 40 },
    walletCard: { padding: 24, borderRadius: 24, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
    walletBalance: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
    withdrawToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 8 },
    withdrawToggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    formCard: { padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
    input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
    statBox: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 16, elevation: 1 },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    historyHeader: { marginBottom: 16 },
    historyTitle: { fontSize: 18, fontWeight: 'bold' },
    txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    txTitle: { fontSize: 15, fontWeight: '600' },
    txDate: { fontSize: 12, color: '#888', marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 12, fontSize: 16 },
});
