import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';

export const DailyPanchang = () => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const isoDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetchPanchang(isoDate);
        if (isMounted) {
          setData(res);
        }
      } catch (e) {
        if (isMounted) {
          setError('Unable to load Panchang');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isoDate]);

  const sunrise = data?.sunrise || '—';
  const sunset = data?.sunset || '—';
  const tithi = data?.tithi || '—';
  const nakshatra = data?.nakshatra || '—';
  const yoga = data?.yoga || '—';
  const auspicious = data?.auspicious_time || '—';
  const nepaliDate = data?.nepali_date || '—';

  const router = useRouter();

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.panchangCard}>
        <View style={styles.mainDateRow}>
          <View style={styles.calendarGraphic}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonthText}>{today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
            </View>
            <View style={styles.calendarBody}>
              <Text style={styles.calendarDayText}>{today.getDate()}</Text>
            </View>
          </View>
          
          <View style={styles.dateInfoContainer}>
            <Text style={styles.nepaliDateBig}>{nepaliDate}</Text>
            <View style={styles.tithiBadge}>
              <Text style={styles.tithiText}>{tithi}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="small" color="#F97316" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.detailsGrid}>
            <View style={styles.gridRow}>
              <PanchangItem label="Nakshatra" value={nakshatra} />
              <PanchangItem label="Sunrise" value={sunrise} />
              <PanchangItem label="Sunset" value={sunset} />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.viewFullBtn}
          onPress={() => router.push('/(customer)/panchang' as any)}
        >
          <Text style={styles.viewFullBtnText}>View Full Panchang</Text>
          <Ionicons name="chevron-forward" size={16} color="#F97316" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PanchangItem = ({ label, value }: any) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  panchangCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  mainDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  calendarGraphic: {
    width: 70,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    alignItems: 'center',
  },
  calendarMonthText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  calendarDayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  dateInfoContainer: {
    flex: 1,
  },
  nepaliDateBig: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tithiBadge: {
    backgroundColor: '#F9731615',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tithiText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  detailsGrid: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewFullBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
});
