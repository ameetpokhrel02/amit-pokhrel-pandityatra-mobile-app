import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Booking } from '@/services/api';

interface UpcomingSessionBannerProps {
  booking: Booking;
  role: 'customer' | 'pandit';
}

export const UpcomingSessionBanner: React.FC<UpcomingSessionBannerProps> = React.memo(({ booking, role }) => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [timeLeft, setTimeLeft] = useState<number>(0); // minutes

  useEffect(() => {
    const calculateTime = () => {
      if (!booking.booking_date || !booking.booking_time) return;
      const sessionStart = dayjs(`${booking.booking_date} ${booking.booking_time}`);
      const diff = sessionStart.diff(dayjs(), 'minute');
      setTimeLeft(diff);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, [booking]);

  const status = useMemo(() => {
    if (timeLeft < -60) return 'hidden'; // Gone for more than an hour
    if (timeLeft < 0) return 'active'; // In progress
    if (timeLeft <= 15) return 'urgent'; // < 15 mins
    if (timeLeft <= 45) return 'warning'; // < 45 mins
    return 'hidden';
  }, [timeLeft]);

  if (status === 'hidden') return null;

  const isUrgent = status === 'urgent' || status === 'active';
  const displayTime = timeLeft > 0 ? `${timeLeft} min` : 'Now';

  const handleJoin = () => {
    // Navigate to video room with booking details
    router.push({
      pathname: '/video',
      params: {
        bookingId: booking.id,
        role: role,
        peerName: role === 'customer' ? booking.pandit_full_name : booking.user_full_name,
        serviceName: booking.service_name
      }
    } as any);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[
        styles.container,
        { 
          backgroundColor: isUrgent ? (isDark ? '#2D1A0A' : '#FFF7ED') : (isDark ? '#1A1A1A' : '#F9FAFB'),
          borderColor: isUrgent ? '#FF6F0060' : 'rgba(0,0,0,0.1)'
        }
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: isUrgent ? '#FF6F0020' : 'rgba(0,0,0,0.05)' }]}>
          <Ionicons 
            name={isUrgent ? "videocam" : "calendar"} 
            size={20} 
            color={isUrgent ? '#FF6F00' : colors.text} 
          />
        </View>
        
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isUrgent ? 'Session Starting Soon' : 'Upcoming Session'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
            {booking.service_name} • {displayTime}
          </Text>
        </View>

        {isUrgent ? (
          <TouchableOpacity 
            onPress={handleJoin}
            style={[styles.joinBtn, { backgroundColor: '#FF6F00' }]}
          >
            <MotiView
               from={{ opacity: 0.6, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ loop: true, type: 'timing', duration: 1000 }}
               style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.joinBtnText}>JOIN NOW</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.timeBadge}>
             <Text style={[styles.timeText, { color: colors.text }]}>{timeLeft}m</Text>
          </View>
        )}
      </View>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  joinBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
