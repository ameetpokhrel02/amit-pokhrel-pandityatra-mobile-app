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
      {/* Top Header Section */}
      <View style={styles.headerRow}>
        <View style={styles.monthSelector}>
          <Text style={[styles.monthText, { color: colors.text }]}>{monthName}</Text>
          <Ionicons name="chevron-down" size={18} color="#FF6F00" style={{ marginLeft: 6 }} />
        </View>
        <TouchableOpacity 
          style={[styles.calendarBtn, { backgroundColor: isDark ? '#2D3748' : '#FFF7ED' }]}
          onPress={() => router.push('/(customer)/panchang' as any)}
        >
          <Ionicons name="calendar" size={20} color="#FF6F00" />
        </TouchableOpacity>
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
                style={[
                  styles.dateBlock,
                  isSelected && [styles.selectedDateBlock, { borderColor: '#FF6F00' }]
                ]}
                onPress={() => setSelectedDate(dateItem)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayLabel, 
                  isSelected ? { color: '#FF6F00' } : { color: isDark ? '#A0AEC0' : '#718096' }
                ]}>
                  {dayLabel}
                </Text>
                <Text style={[
                  styles.dateNum,
                  isSelected ? { color: '#1A202C' } : { color: isDark ? '#E2E8F0' : '#2D3748' }
                ]}>
                  {dateNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Panchang Card */}
      <View style={[
        styles.panchangCard, 
        { 
          backgroundColor: isDark ? '#1A202C' : '#FFF',
          shadowColor: '#000',
        }
      ]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.dateInfoMain}>
            <Text style={[styles.displayDate, { color: isDark ? '#FFF' : '#1A202C' }]}>
              {displayDateStr}
            </Text>
            <View style={styles.nepaliDateBadge}>
              <Text style={styles.nepaliDateText}>{nepaliDateStr}</Text>
            </View>
          </View>
          <Text style={[styles.cardSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            {tithiStr} • {nakshatraStr}
          </Text>
        </View>

        {loading ? (
          <View style={{ height: 120, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#FF6F00" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* Sunrise / Sunset Row */}
            <View style={styles.infoRow}>
               <View style={[styles.infoBox, { backgroundColor: isDark ? '#2D3748' : '#FFFBEB' }]}>
                  <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="sunny" size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Sunrise / Sunset</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#78350F' }]}>
                      {data?.sunrise || '05:30'} - {data?.sunset || '18:30'}
                    </Text>
                  </View>
               </View>

               <View style={[styles.infoBox, { backgroundColor: isDark ? '#2D3748' : '#F0F9FF' }]}>
                  <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="time" size={20} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Auspicious Time</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#0C4A6E' }]}>
                      {auspicious}
                    </Text>
                  </View>
               </View>
            </View>

            {/* Sub Stats Row */}
            <View style={styles.subStatsRow}>
              <View style={styles.subStatItem}>
                <Ionicons name="sparkles" size={14} color="#FF6F00" />
                <Text style={styles.subStatLabel}>YOGA:</Text>
                <Text style={[styles.subStatValue, { color: isDark ? '#FFF' : '#2D3748' }]}>{data?.yoga || '—'}</Text>
              </View>
              <View style={styles.subStatItem}>
                <Ionicons name={isDay ? "sunny-sharp" : "moon"} size={14} color="#718096" />
                <Text style={styles.subStatLabel}>STATUS:</Text>
                <Text style={[styles.subStatValue, { color: isDay ? '#D97706' : '#4A5568' }]}>
                  {isDay ? "Daytime" : "Nighttime"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Floating Action Button for More Details */}
      <TouchableOpacity 
        style={[styles.moreDetailsBtn, { backgroundColor: '#FF6F00' }]}
        onPress={() => router.push('/(customer)/panchang' as any)}
      >
        <Text style={styles.moreDetailsText}>View Detailed Horoscope & Panchang</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calendarBtn: {
    padding: 10,
    borderRadius: 14,
  },
  weekSliderContainer: {
    marginBottom: 14,
  },
  weekScrollContent: {
    gap: 12,
  },
  dateBlock: {
    width: 60,
    height: 76,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedDateBlock: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  panchangCard: {
    borderRadius: 32,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 24,
  },
  dateInfoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  displayDate: {
    fontSize: 18,
    fontWeight: '900',
  },
  nepaliDateBadge: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  nepaliDateText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  statsContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  subStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A0AEC0',
  },
  subStatValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  moreDetailsBtn: {
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  moreDetailsText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
