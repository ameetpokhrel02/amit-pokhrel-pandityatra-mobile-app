import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { PanchangData } from '@/services/api';
import { BsDate, NEPALI_MONTHS, NEPALI_WEEKDAYS, bsToAdIsoString, toDevanagariDigits } from '@/utils/nepaliCalendar';

interface PanchangDayDetailsProps {
  selected: BsDate;
  data: PanchangData | null;
  loading: boolean;
}

export const PanchangDayDetails = ({ selected, data, loading }: PanchangDayDetailsProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const line = isDark ? '#2A2F3A' : '#EEE7DF';
  const muted = colors.text + '70';

  const ad = dayjs(bsToAdIsoString(selected));
  const weekdayNp = NEPALI_WEEKDAYS[ad.day()];

  return (
    <View style={styles.wrap}>
      {/* Selected day header */}
      <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: line }]}>
        <View style={[styles.dateBlock, { backgroundColor: colors.primary }]}>
          <Text style={styles.dateBlockMonth}>{NEPALI_MONTHS[selected.month]}</Text>
          <Text style={styles.dateBlockDay}>{toDevanagariDigits(selected.date)}</Text>
        </View>
        <View style={styles.dayInfo}>
          <Text style={[styles.dayTitle, { color: colors.text }]}>
            {weekdayNp}बार, {toDevanagariDigits(selected.year)}
          </Text>
          <Text style={[styles.daySub, { color: muted }]}>{ad.format('dddd, D MMMM YYYY')}</Text>
          {!!data?.tithi && !loading && (
            <View style={[styles.tithiPill, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="moon" size={11} color={colors.primary} />
              <Text style={[styles.tithiText, { color: colors.primary }]} numberOfLines={1}>{data.tithi}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Sun timings */}
          <View style={[styles.sunRow, { backgroundColor: colors.card, borderColor: line }]}>
            <SunItem icon="sunny-outline" tint="#F59E0B" label="Sunrise" value={data?.sunrise} textColor={colors.text} muted={muted} />
            <View style={[styles.sunDivider, { backgroundColor: line }]} />
            <SunItem icon="moon-outline" tint="#6366F1" label="Sunset" value={data?.sunset} textColor={colors.text} muted={muted} />
          </View>

          {/* Panchang elements */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Panchang</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: line }]}>
            {[
              { label: 'Tithi', value: data?.tithi, icon: 'moon-outline' },
              { label: 'Nakshatra', value: data?.nakshatra, icon: 'star-outline' },
              { label: 'Yoga', value: data?.yoga, icon: 'infinite-outline' },
              { label: 'Karana', value: data?.karana, icon: 'git-branch-outline' },
              { label: 'Rashi', value: data?.rashi, icon: 'planet-outline' },
            ].map((row, i, all) => (
              <View
                key={row.label}
                style={[styles.listRow, i < all.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line }]}
              >
                <View style={styles.listLeft}>
                  <Ionicons name={row.icon as any} size={16} color={colors.primary} />
                  <Text style={[styles.listLabel, { color: muted }]}>{row.label}</Text>
                </View>
                <Text style={[styles.listValue, { color: colors.text }]} numberOfLines={1}>{row.value || '—'}</Text>
              </View>
            ))}
          </View>

          {/* Muhurta */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Auspicious Time</Text>
          <View style={[styles.muhurtaCard, { backgroundColor: isDark ? '#10261D' : '#ECFDF5', borderColor: isDark ? '#1F4D38' : '#A7F3D0' }]}>
            <View style={[styles.muhurtaIcon, { backgroundColor: '#10B98122' }]}>
              <Ionicons name="time-outline" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.muhurtaLabel, { color: isDark ? '#6EE7B7' : '#047857' }]}>Abhijit Muhurta</Text>
              <Text style={[styles.muhurtaValue, { color: isDark ? '#FFF' : '#065F46' }]}>
                {data?.auspicious_time || 'Not available for this day'}
              </Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.note}>Timings are approximate for Kathmandu, Nepal. Ask your Pandit for location-specific accuracy.</Text>
    </View>
  );
};

const SunItem = ({ icon, tint, label, value, textColor, muted }: any) => (
  <View style={styles.sunItem}>
    <View style={[styles.sunIcon, { backgroundColor: tint + '1A' }]}>
      <Ionicons name={icon} size={18} color={tint} />
    </View>
    <View>
      <Text style={[styles.sunLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.sunValue, { color: textColor }]}>{value || '—'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },

  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  dateBlock: {
    width: 68,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBlockMonth: { color: '#FFFFFFD0', fontSize: 11, fontWeight: '700' },
  dateBlockDay: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: -2 },
  dayInfo: { flex: 1, marginLeft: 14 },
  dayTitle: { fontSize: 16, fontWeight: '800' },
  daySub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tithiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    maxWidth: '100%',
  },
  tithiText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },

  loading: { height: 140, justifyContent: 'center', alignItems: 'center' },

  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 12,
  },
  sunItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sunIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sunLabel: { fontSize: 11, fontWeight: '600' },
  sunValue: { fontSize: 15, fontWeight: '800', marginTop: 1 },
  sunDivider: { width: 1, height: 32 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  listCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listLabel: { fontSize: 14, fontWeight: '600' },
  listValue: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 16 },

  muhurtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  muhurtaIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  muhurtaLabel: { fontSize: 12, fontWeight: '700' },
  muhurtaValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },

  note: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 17, marginTop: 20, paddingHorizontal: 12 },
});
