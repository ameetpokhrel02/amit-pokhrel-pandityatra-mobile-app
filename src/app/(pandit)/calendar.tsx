import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
import { Colors } from '@/theme/colors';
import { fetchPanditCalendar, addAvailabilityBlock, deleteAvailabilityBlock } from '@/services/pandit.service';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false);
  
  const [newBlock, setNewBlock] = useState({ 
    title: '', 
    startTime: dayjs().set('hour', 9).set('minute', 0),
    endTime: dayjs().set('hour', 10).set('minute', 0)
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const data = await fetchPanditCalendar();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const markedDates = useMemo(() => {
    const marks: any = {};
    events.forEach(event => {
      const dateKey = dayjs(event.start_time || event.start).format('YYYY-MM-DD');
      if (!marks[dateKey]) {
        marks[dateKey] = { marked: true, dotColor: Colors.light.primary };
      }
    });
    
    // Add selection highlight
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: Colors.light.primary,
    };
    
    return marks;
  }, [events, selectedDate]);

  const selectedDateEvents = useMemo(() => {
    return events.filter(event =>
      dayjs(event.start_time || event.start).isSame(selectedDate, 'day')
    ).sort((a, b) => dayjs(a.start_time || a.start).diff(dayjs(b.start_time || b.start)));
  }, [events, selectedDate]);

  const handleCreateBlock = async () => {
    if (!newBlock.title) {
      Alert.alert('Error', 'Please enter a title for the block');
      return;
    }

    try {
      setSubmitting(true);
      const baseDate = dayjs(selectedDate);
      const start = baseDate.hour(newBlock.startTime.hour()).minute(newBlock.startTime.minute()).toISOString();
      const end = baseDate.hour(newBlock.endTime.hour()).minute(newBlock.endTime.minute()).toISOString();
      
      await addAvailabilityBlock({
        title: newBlock.title,
        start_time: start,
        end_time: end,
        type: 'block'
      });
      
      Alert.alert('Success', 'Availability block added');
      setShowAddModal(false);
      setNewBlock({ 
        title: '', 
        startTime: dayjs().set('hour', 9).set('minute', 0),
        endTime: dayjs().set('hour', 10).set('minute', 0)
      });
      fetchCalendarData();
    } catch (error) {
      console.error('Add block error:', error);
      Alert.alert('Error', 'Failed to add block');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    Alert.alert(
      'Delete Block',
      'Are you sure you want to remove this availability block?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAvailabilityBlock(id);
              fetchCalendarData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete block');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Manage your availability and schedule</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDate}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: Colors.light.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: Colors.light.primary,
              arrowColor: Colors.light.primary,
              dotColor: Colors.light.primary,
              monthTextColor: '#333',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              calendarBackground: 'transparent',
            }}
          />
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {dayjs(selectedDate).format('DD MMMM, YYYY')}
            </Text>
            <TouchableOpacity 
              style={styles.textAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={24} color={Colors.light.primary} />
              <Text style={styles.textAddButtonLabel}>Block Time</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.eventsList}>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[
                      styles.eventIndicator, 
                      { backgroundColor: event.type === 'booking' ? '#3B82F6' : '#EF4444' }
                    ]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {dayjs(event.start_time || event.start).format('hh:mm A')} - {dayjs(event.end_time || event.end).format('hh:mm A')}
                      </Text>
                      {event.type === 'booking' && (
                        <View style={styles.bookingBadge}>
                          <Text style={styles.bookingBadgeText}>Puja Booking</Text>
                        </View>
                      )}
                    </View>
                    
                    {event.type !== 'booking' && (
                      <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => handleDeleteBlock(event.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
                  <Text style={styles.emptyText}>No events or blocks for this day</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Block Time Slot</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDate}>{dayjs(selectedDate).format('dddd, DD MMM YYYY')}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title / Reason</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Personal Maintenance, Travel"
                value={newBlock.title}
                onChangeText={(text) => setNewBlock({ ...newBlock, title: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => setStartTimePickerVisibility(true)}
                >
                  <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.timeValue}>{newBlock.startTime.format('hh:mm A')}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 15 }]}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => setEndTimePickerVisibility(true)}
                >
                  <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.timeValue}>{newBlock.endTime.format('hh:mm A')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: Colors.light.primary }]} 
              onPress={handleCreateBlock}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Block</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isStartTimePickerVisible}
        mode="time"
        date={newBlock.startTime.toDate()}
        onConfirm={(date) => {
          setNewBlock({ ...newBlock, startTime: dayjs(date) });
          setStartTimePickerVisibility(false);
        }}
        onCancel={() => setStartTimePickerVisibility(false)}
      />

      <DateTimePickerModal
        isVisible={isEndTimePickerVisible}
        mode="time"
        date={newBlock.endTime.toDate()}
        onConfirm={(date) => {
          setNewBlock({ ...newBlock, endTime: dayjs(date) });
          setEndTimePickerVisibility(false);
        }}
        onCancel={() => setEndTimePickerVisibility(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  calendarCard: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 25,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  eventsSection: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20 
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  textAddButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textAddButtonLabel: { color: Colors.light.primary, fontWeight: '600', fontSize: 14 },
  eventsList: { gap: 12 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  eventIndicator: { width: 4, height: 35, borderRadius: 2, marginRight: 16 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  eventTime: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  bookingBadge: { 
    backgroundColor: '#EBF5FF', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    marginTop: 6
  },
  bookingBadgeText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  deleteButton: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 25,
    paddingBottom: 40
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10 
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  modalDate: { fontSize: 15, color: Colors.light.primary, fontWeight: '600', marginBottom: 25 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textInput: { 
    backgroundColor: '#F9FAFB',
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 16,
    color: '#111827'
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    gap: 10
  },
  timeValue: { fontSize: 16, color: '#111827', fontWeight: '500' },
  row: { flexDirection: 'row' },
  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitBtnText: { fontWeight: '700', color: '#FFF', fontSize: 16 },
});

