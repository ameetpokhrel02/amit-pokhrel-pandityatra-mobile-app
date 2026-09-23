import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';
import { NEPALI_MONTHS, NEPALI_WEEKDAYS, getTodayBs, toDevanagariDigits } from '@/utils/nepaliCalendar';

export const DailyPanchang = React.memo(() => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  const todayBs = useMemo(() => getTodayBs(), []);
  const today = useMemo(() => dayjs(), []);

  useEffect(() => {
    let mounted = true;
    fetchPanchang(today.format('YYYY-MM-DD'))
      .then((res) => mounted && setData(res))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [today]);

  const goToDetail = () => router.push('/(customer)/panchang' as any);

  const line = isDark ? '#2A2F3A' : '#F3E8DC';
  const muted = colors.text + '70';

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Today&apos;s Panchang</Text>
        <TouchableOpacity onPress={goToDetail} style={styles.seeAll} hitSlop={8}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>View Patro</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.92}
        onPress={goToDetail}
        style={[styles.card, { backgroundColor: colors.card, borderColor: line }]}
        accessibilityRole="button"
        accessibilityLabel="Open today's Panchang"
      >
        {/* Date header */}
        <LinearGradient
          colors={isDark ? ['#2A1D12', '#1B1F27'] : ['#FFF7ED', '#FFEDD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Tear-off calendar leaf */}
          <View style={[styles.leaf, { backgroundColor: isDark ? '#12151B' : '#FFF' }]}>
            <View style={[styles.leafTop, { backgroundColor: colors.primary }]}>
              <Text style={styles.leafMonth}>{NEPALI_MONTHS[todayBs.month]}</Text>
            </View>
            <Text style={[styles.leafDay, { color: colors.text }]}>{toDevanagariDigits(todayBs.date)}</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.weekday, { color: colors.text }]}>{NEPALI_WEEKDAYS[today.day()]}बार</Text>
            <Text style={[styles.bsFull, { color: colors.text + 'CC' }]}>
              {NEPALI_MONTHS[todayBs.month]} {toDevanagariDigits(todayBs.date)}, {toDevanagariDigits(todayBs.year)}
            </Text>
            <Text style={[styles.adFull, { color: muted }]}>{today.format('dddd, D MMMM YYYY')}</Text>

            {loading ? (
              <View style={styles.tithiLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              !!data?.tithi && (
                <View style={[styles.tithiPill, { backgroundColor: colors.primary }]}>
                  <Ionicons name="moon" size={11} color="#FFF" />
                  <Text style={styles.tithiText} numberOfLines={1}>{data.tithi}</Text>
                </View>
              )
            )}
          </View>
        </LinearGradient>

        {/* Key timings */}
        <View style={styles.statsRow}>
          <Stat icon="sunny-outline" tint="#F59E0B" label="Sunrise" value={data?.sunrise} loading={loading} textColor={colors.text} muted={muted} />
          <View style={[styles.statDivider, { backgroundColor: line }]} />
          <Stat icon="moon-outline" tint="#6366F1" label="Sunset" value={data?.sunset} loading={loading} textColor={colors.text} muted={muted} />
          <View style={[styles.statDivider, { backgroundColor: line }]} />
          <Stat icon="star-outline" tint="#10B981" label="Nakshatra" value={data?.nakshatra} loading={loading} textColor={colors.text} muted={muted} />
        </View>

        {/* Muhurta */}
        {!loading && !!data?.auspicious_time && (
          <View style={[styles.muhurta, { borderTopColor: line }]}>
            <Ionicons name="time-outline" size={15} color="#10B981" />
            <Text style={[styles.muhurtaLabel, { color: muted }]}>Abhijit Muhurta</Text>
            <Text style={[styles.muhurtaValue, { color: colors.text }]} numberOfLines={1}>{data.auspicious_time}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});
DailyPanchang.displayName = 'DailyPanchang';

const Stat = ({ icon, tint, label, value, loading, textColor, muted }: any) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={18} color={tint} />
    <Text style={[styles.statValue, { color: textColor }]} numberOfLines={1}>
      {loading ? '···' : value || '—'}
    </Text>
    <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, marginTop: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '900' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '800' },

  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },

  hero: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  leaf: {
    width: 76,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  leafTop: { alignSelf: 'stretch', paddingVertical: 5, alignItems: 'center' },
  leafMonth: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  leafDay: { fontSize: 32, fontWeight: '900', paddingVertical: 6 },

  heroInfo: { flex: 1, marginLeft: 16 },
  weekday: { fontSize: 18, fontWeight: '900' },
  bsFull: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  adFull: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tithiLoading: { alignSelf: 'flex-start', marginTop: 10 },
  tithiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
    maxWidth: '100%',
  },
  tithiText: { color: '#FFF', fontSize: 11, fontWeight: '800', flexShrink: 1 },

  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  statValue: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: 1, height: 36 },

  muhurta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  muhurtaLabel: { fontSize: 12, fontWeight: '700' },
  muhurtaValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800' },
});
