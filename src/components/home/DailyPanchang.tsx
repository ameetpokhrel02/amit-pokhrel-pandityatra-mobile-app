import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';

const generateWeekSequence = (centerDate: Date) => {
  const days = [];
  // Generate 15 days so user can scroll a bit (7 days before, 7 days after)
  for (let i = -7; i <= 7; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatDayLabel = (date: Date) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[date.getDay()];
};

// Auto-update day/night detection based on user's system clock
const isDayTime = () => {
  const hour = new Date().getHours();
  // Assuming day is 6 AM to 6 PM
  return hour >= 6 && hour < 18;
};

export const DailyPanchang = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDay, setIsDay] = useState(isDayTime());

  const weekSequence = useRef(generateWeekSequence(new Date())).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Center the scroll view on the current date initially
  useEffect(() => {
    setTimeout(() => {
      // rough calculation: each date item is ~50px wide. Center is index 7.
      scrollViewRef.current?.scrollTo({ x: 7 * 50 - 150, animated: false });
    }, 100);
  }, []);

  // Update real-time day/night every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setIsDay(isDayTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDateData = async () => {
      setLoading(true);
      try {
        // Adjust for timezone offset to get YYYY-MM-DD
        const offset = selectedDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(selectedDate.getTime() - offset)).toISOString().slice(0, 10);
        
        const res = await fetchPanchang(localISOTime);
        if (isMounted) setData(res);
      } catch (e) {
        console.error('Failed to load panchang:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDateData();
    return () => { isMounted = false; };
  }, [selectedDate]);

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const displayDateStr = `${selectedDate.getDate().toString().padStart(2, '0')} ${selectedDate.toLocaleDateString('en-US', { month: 'long' })} (${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })})`;

  const nepaliDateStr = data?.nepali_date || '—';
  const tithiStr = data?.tithi ? `${data.tithi}` : '—';
  const nakshatraStr = data?.nakshatra ? `${data.nakshatra}` : '—';
  const auspicious = data?.auspicious_time ? data.auspicious_time : '—';

  return (
    <View style={styles.container}>
      {/* Top Month Label */}
      <View style={styles.monthHeader}>
        <Ionicons name="menu-outline" size={24} color={colors.text} />
        <Text style={[styles.monthText, { color: colors.text }]}>{monthName}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4 }} />
      </View>

      {/* Week Slider */}
      <View style={styles.weekSliderContainer}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScrollContent}
        >
          {weekSequence.map((dateItem, index) => {
            const isSelected = dateItem.toDateString() === selectedDate.toDateString();
            const dayLabel = formatDayLabel(dateItem);
            const dateNum = dateItem.getDate().toString().padStart(2, '0');

            return (
              <TouchableOpacity 
                key={index} 
                style={styles.dateBlock}
                onPress={() => setSelectedDate(dateItem)}
              >
                <Text style={[
                  styles.dayLabel, 
                  isSelected ? { color: '#FF6F00' } : { color: isDark ? '#999' : '#A0AEC0' }
                ]}>
                  {dayLabel}
                </Text>
                <View style={[
                  styles.dateCircle, 
                  isSelected && { backgroundColor: '#FF6F00' }
                ]}>
                  <Text style={[
                    styles.dateNum,
                    isSelected ? { color: '#FFF' } : { color: isDark ? '#FFF' : '#4A5568' }
                  ]}>
                    {dateNum}
                  </Text>
                </View>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Panchang Card */}
      <View style={[
        styles.panchangCard, 
        { 
          backgroundColor: isDark ? colors.card : '#FFF',
          borderColor: isDark ? '#333' : '#E2E8F0',
          borderWidth: isDark ? 1 : 0,
        }
      ]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#1A202C' }]}>
            {displayDateStr}  <Text style={{ color: '#FF6F00' }}>{nepaliDateStr}</Text>
          </Text>
          <Text style={[styles.cardSubtitle, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
            {tithiStr} • {nakshatraStr}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FF6F00" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Sun & Moon Boxes */}
            <View style={styles.astronomyRow}>
              {/* Sunrise Box */}
              <View style={[styles.astroBox, { backgroundColor: isDark ? '#2D3748' : '#FEFCBF' }]}>
                {isDay ? (
                  <Ionicons name="sunny" size={24} color="#D69E2E" />
                ) : (
                  <Ionicons name="partly-sunny" size={24} color="#D69E2E" />
                )}
                <View style={styles.astroTextContainer}>
                  <Text style={[styles.astroLabel, { color: isDark ? '#A0AEC0' : '#744210' }]}>Sunrise / Sunset</Text>
                  <Text style={[styles.astroTime, { color: isDark ? '#FFF' : '#744210' }]}>
                    {data?.sunrise || '05:30'} - {data?.sunset || '18:30'}
                  </Text>
                </View>
              </View>

              {/* Moon Box */}
              <View style={[styles.astroBox, { backgroundColor: isDark ? '#1A202C' : '#EDF2F7' }]}>
                {isDay ? (
                  <Ionicons name="moon-outline" size={24} color="#4A5568" />
                ) : (
                  <Ionicons name="moon" size={24} color="#718096" />
                )}
                <View style={styles.astroTextContainer}>
                  <Text style={[styles.astroLabel, { color: isDark ? '#A0AEC0' : '#2D3748' }]}>Auspicious Time</Text>
                  <Text style={[styles.astroTime, { color: isDark ? '#FFF' : '#2D3748' }]}>
                    {auspicious}
                  </Text>
                </View>
              </View>
            </View>

            {/* Extras */}
            <View style={styles.extrasRow}>
              <View style={styles.extraCol}>
                <Text style={styles.extraLabel}>YOGA</Text>
                <Text style={[styles.extraValue, { color: isDark ? '#FFF' : '#1A202C' }]}>{data?.yoga || '—'}</Text>
              </View>
              <View style={styles.extraCol}>
                <Text style={styles.extraLabel}>DAY STATUS</Text>
                <Text style={[styles.extraValue, { color: isDay ? '#D69E2E' : '#718096' }]}>
                  {isDay ? "Daytime 🌞" : "Nighttime 🌙"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* View Full Panchang Banner */}
      <TouchableOpacity 
        style={[styles.fullPanchangBtn, { backgroundColor: isDark ? '#2D3748' : '#FFEDD5' }]}
        onPress={() => router.push('/(customer)/panchang' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.fullPanchangRow}>
          <Text style={styles.fullPanchangText}>Today's Detailed Horoscope & Panchang</Text>
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={20} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  weekSliderContainer: {
    marginBottom: 20,
  },
  weekScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6F00',
    marginTop: 6,
  },
  panchangCard: {
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  astronomyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  astroBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  astroTextContainer: {
    flex: 1,
  },
  astroLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  astroTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  extrasRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  extraCol: {
    flex: 1,
  },
  extraLabel: {
    fontSize: 10,
    color: '#A0AEC0',
    fontWeight: '700',
    marginBottom: 4,
  },
  extraValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullPanchangBtn: {
    borderRadius: 16,
    padding: 16,
  },
  fullPanchangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullPanchangText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DD6B20',
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
