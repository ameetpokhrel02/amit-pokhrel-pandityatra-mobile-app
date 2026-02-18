import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Colors } from '@/constants/Colors';
import { PanditService } from '@/services/pandit.service';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const [date, setDate] = useState(dayjs());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const data = await PanditService.getCalendar();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching calendar:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
  }, []);

  const selectedDateEvents = events.filter(event =>
    dayjs(event.start).isSame(date, 'day')
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      <View style={styles.calendarContainer}>
        <DateTimePicker
          date={date}
          onChange={(params: any) => setDate(dayjs(params.date))}
          mode="single"
          // @ts-ignore
          headerTextStyle={styles.calendarHeader}
          // @ts-ignore
          calendarTextStyle={styles.calendarText}
          // @ts-ignore
          selectedItemColor={Colors.light.primary}
          todayTextStyle={{ color: Colors.light.primary, fontWeight: 'bold' }}
        />
      </View>

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>
          Events for {date.format('DD MMM, YYYY')}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.eventsList}>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventIndicator, { backgroundColor: event.type === 'booking' ? '#3B82F6' : '#EF4444' }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {dayjs(event.start).format('hh:mm A')} - {dayjs(event.end).format('hh:mm A')}
                    </Text>
                  </View>
                  {event.type === 'booking' && (
                    <TouchableOpacity style={styles.detailButton}>
                      <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color="#DDD" />
                <Text style={styles.emptyText}>No events scheduled for this day.</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ Block Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    padding: 10,
    margin: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  calendarHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  calendarText: {
    fontSize: 14,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 15,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  eventIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  detailButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  addButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
