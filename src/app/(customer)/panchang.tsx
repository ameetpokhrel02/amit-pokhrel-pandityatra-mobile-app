import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';

const { width } = Dimensions.get('window');

export default function PanchangScreen() {
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10);
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const [data, setData] = useState<PanchangData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPanchang();
    }, []);

    const loadPanchang = async () => {
        try {
            setLoading(true);
            const res = await fetchPanchang(isoDate);
            setData(res);
        } catch (e) {
            setError('Unable to load Panchang data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Fetching celestial data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Panchang</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Date Header */}
                <View style={[styles.dateCard, { backgroundColor: isDark ? '#1F2937' : '#FFF7ED' }]}>
                    <Text style={styles.nepaliDate}>{data?.nepali_date || '—'}</Text>
                    <Text style={[styles.englishDate, { color: colors.text }]}>
                        {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                    <View style={styles.tithiBadge}>
                        <Text style={styles.tithiText}>{data?.tithi || '—'}</Text>
                    </View>
                </View>

                {/* Main Stats */}
                <View style={styles.statsGrid}>
                    <StatItem icon="sunny" label="Sunrise" value={data?.sunrise || '—'} color="#F59E0B" isDark={isDark} />
                    <StatItem icon="moon" label="Sunset" value={data?.sunset || '—'} color="#6366F1" isDark={isDark} />
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Celestial Details</Text>
                    <DetailRow label="Nakshatra" value={data?.nakshatra || '—'} isDark={isDark} />
                    <DetailRow label="Yoga" value={data?.yoga || '—'} isDark={isDark} />
                    <DetailRow label="Karana" value={data?.karana || '—'} isDark={isDark} />
                    <DetailRow label="Rashi" value={data?.rashi || '—'} isDark={isDark} />
                </View>

                {/* Auspicious Times */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Auspicious Times</Text>
                    <View style={[styles.auspiciousCard, { backgroundColor: isDark ? '#1F2937' : '#F0FDF4' }]}>
                        <Ionicons name="time" size={20} color="#10B981" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.auspiciousLabel, { color: isDark ? '#9CA3AF' : '#047857' }]}>Abhijit Muhurta</Text>
                            <Text style={[styles.auspiciousValue, { color: isDark ? '#FFF' : '#065F46' }]}>
                                {data?.auspicious_time || 'Check later for better timings'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Note */}
                <View style={styles.noteBox}>
                    <Text style={styles.noteText}>
                        * These timings are approximate for Kathmandu, Nepal. Contact your Pandit for location-specific accuracy.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const StatItem = ({ icon, label, value, color, isDark }: any) => (
    <View style={[styles.statItem, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
        <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#333' }]}>{value}</Text>
    </View>
);

const DetailRow = ({ label, value, isDark }: any) => (
    <View style={[styles.detailRow, { borderBottomColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#333' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    dateCard: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    nepaliDate: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D97706',
        marginBottom: 8,
    },
    englishDate: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 16,
    },
    tithiBadge: {
        backgroundColor: '#D97706',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    tithiText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 1,
    },
    iconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    auspiciousCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    auspiciousLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    auspiciousValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    noteBox: {
        marginTop: 20,
        padding: 16,
    },
    noteText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});
