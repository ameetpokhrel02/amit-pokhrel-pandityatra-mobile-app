import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';

const { width } = Dimensions.get('window');

export default function PanchangScreen() {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [data, setData] = useState<PanchangData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFullCalendar, setShowFullCalendar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPanchang(selectedDate);
    }, [selectedDate]);

    const loadPanchang = async (dateStr: string) => {
        try {
            setLoading(true);
            const res = await fetchPanchang(dateStr);
            setData(res);
        } catch (e) {
            setError('Unable to load Panchang data');
        } finally {
            setLoading(false);
        }
    };

    const weekDates = Array.from({ length: 7 }).map((_, i) => dayjs(selectedDate).startOf('week').add(i, 'day'));

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
                <TouchableOpacity onPress={() => setShowFullCalendar(!showFullCalendar)} style={styles.calendarToggle}>
                    <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {showFullCalendar && (
                <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day: any) => {
                            setSelectedDate(day.dateString);
                            setShowFullCalendar(false);
                        }}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: colors.primary }
                        }}
                        theme={{
                            backgroundColor: colors.card,
                            calendarBackground: colors.card,
                            textSectionTitleColor: colors.primary,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: isDark ? '#444' : '#d9e1e8',
                            dotColor: colors.primary,
                            monthTextColor: colors.text,
                            indicatorColor: colors.primary,
                        }}
                    />
                </View>
            )}

            {/* Quick Week Picker */}
            <View style={[styles.weekStrip, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                {weekDates.map((date) => {
                    const isSelected = date.format('YYYY-MM-DD') === selectedDate;
                    return (
                        <TouchableOpacity
                            key={date.format('YYYY-MM-DD')}
                            onPress={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                            style={[
                                styles.weekDayItem,
                                isSelected && { backgroundColor: colors.primary }
                            ]}
                        >
                            <Text style={[styles.weekDayLabel, { color: isSelected ? '#FFF' : colors.text + '80' }]}>
                                {date.format('ddd')}
                            </Text>
                            <Text style={[styles.weekDayValue, { color: isSelected ? '#FFF' : colors.text }]}>
                                {date.format('D')}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Date Header */}
                <View style={[styles.dateCard, { backgroundColor: isDark ? '#1F2937' : '#FFF7ED' }]}>
                    <Text style={styles.nepaliDate}>{data?.nepali_date || '—'}</Text>
                    <Text style={[styles.englishDate, { color: colors.text }]}>
                        {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
                    </Text>
                    <View style={styles.tithiBadge}>
                        <Text style={styles.tithiText}>{data?.tithi || '—'}</Text>
                    </View>
                    
                    <View style={styles.dateNavRows}>
                        <TouchableOpacity onPress={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}>
                            <Ionicons name="chevron-back" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                            style={[styles.todayBtn, { borderColor: colors.primary }]}
                        >
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>TODAY</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}>
                            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Stats */}
                <View style={styles.statsGrid}>
                    <StatItem icon="sunny" label="Sunrise" value={data?.sunrise || '—'} color="#F59E0B" isDark={isDark} />
                    <StatItem icon="moon" label="Sunset" value={data?.sunset || '—'} color="#6366F1" isDark={isDark} />
                </View>

                {/* Details Section */}
                <View style={[styles.section, styles.detailsCard, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#F3F4F6' }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>Celestial Details</Text>
                    <DetailRow label="Nakshatra" value={data?.nakshatra || '—'} icon="star" isDark={isDark} />
                    <DetailRow label="Yoga" value={data?.yoga || '—'} icon="infinite" isDark={isDark} />
                    <DetailRow label="Karana" value={data?.karana || '—'} icon="analytics" isDark={isDark} />
                    <DetailRow label="Rashi" value={data?.rashi || '—'} icon="moon" isDark={isDark} />
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
    <View style={[styles.statItem, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={26} color={color} />
        </View>
        <View style={{ alignItems: 'center' }}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#1F2937' }]}>{value}</Text>
        </View>
    </View>
);

const DetailRow = ({ label, value, icon, isDark }: any) => (
    <View style={[styles.detailRow, { borderBottomColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <View style={styles.detailLeft}>
            <View style={[styles.miniIcon, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}>
                <Ionicons name={icon} size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </View>
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
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
        flex: 1,
        textAlign: 'center',
    },
    calendarToggle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    weekStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    weekDayItem: {
        width: 44,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    weekDayLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    weekDayValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateNavRows: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 24,
    },
    todayBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
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
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    iconBg: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
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
    detailsCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    miniIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
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
