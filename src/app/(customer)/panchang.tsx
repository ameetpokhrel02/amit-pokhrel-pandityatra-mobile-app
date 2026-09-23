import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';
import { BsDate, bsToAdIsoString, getTodayBs } from '@/utils/nepaliCalendar';
import { PanchangCalendar } from '@/components/panchang/PanchangCalendar';
import { PanchangDayDetails } from '@/components/panchang/PanchangDayDetails';

export default function PanchangScreen() {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const todayBs = useMemo(() => getTodayBs(), []);
    const [selected, setSelected] = useState<BsDate>(todayBs);

    const [data, setData] = useState<PanchangData | null>(null);
    const [loading, setLoading] = useState(true);

    const selectDay = (bs: BsDate) => {
        if (bs.year === selected.year && bs.month === selected.month && bs.date === selected.date) return;
        setSelected(bs);
        setLoading(true);
    };

    useEffect(() => {
        let mounted = true;
        fetchPanchang(bsToAdIsoString(selected))
            .then((res) => mounted && setData(res))
            .catch(() => mounted && setData(null))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, [selected]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: isDark ? '#2A2F3A' : '#F0F0F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Nepali Patro</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.text + '70' }]}>Daily Panchang</Text>
                </View>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <PanchangCalendar today={todayBs} selected={selected} onSelect={selectDay} />
                <PanchangDayDetails selected={selected} data={data} loading={loading} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    headerSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
});
