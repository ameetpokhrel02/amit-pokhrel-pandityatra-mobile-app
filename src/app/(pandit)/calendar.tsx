import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Colors } from '@/constants/Colors';
import { fetchPanditCalendar, addAvailabilityBlock, deleteAvailabilityBlock } from '@/services/pandit.service';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, Alert, TextInput } from 'react-native';

export default function CalendarScreen() {
  const [date, setDate] = useState(dayjs());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', startTime: '09:00', endTime: '10:00' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const data = await fetchPanditCalendar();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleCreateBlock = async () => {
    if (!newBlock.title) {
      Alert.alert('Error', 'Please enter a title for the block');
      return;
    }

    try {
      setSubmitting(true);
      const start = date.hour(parseInt(newBlock.startTime.split(':')[0])).minute(parseInt(newBlock.startTime.split(':')[1])).format();
      const end = date.hour(parseInt(newBlock.endTime.split(':')[0])).minute(parseInt(newBlock.endTime.split(':')[1])).format();
      
      await addAvailabilityBlock({
        title: newBlock.title,
        start_time: start,
        end_time: end
      });
      
      Alert.alert('Success', 'Availability block added');
      setShowAddModal(false);
      setNewBlock({ title: '', startTime: '09:00', endTime: '10:00' });
      fetchCalendarData();
    } catch (error) {
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
          onChange={(params: any) => {
            if (params.date) setDate(dayjs(params.date));
          }}
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
                   {event.type === 'booking' ? (
                    <TouchableOpacity style={styles.detailButton}>
                      <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                  ) : (
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
                <Ionicons name="calendar-outline" size={40} color="#DDD" />
                <Text style={styles.emptyText}>No events scheduled for this day.</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                  <Text style={styles.addButtonText}>+ Block Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Colors.light.primary }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Availability Block</Text>
            <Text style={styles.modalDate}>{date.format('DD MMM, YYYY')}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title / Reason</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Family Function, Personal"
                value={newBlock.title}
                onChangeText={(text) => setNewBlock({ ...newBlock, title: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="09:00"
                  value={newBlock.startTime}
                  onChangeText={(text) => setNewBlock({ ...newBlock, startTime: text })}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 15 }]}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10:00"
                  value={newBlock.endTime}
                  onChangeText={(text) => setNewBlock({ ...newBlock, endTime: text })}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: Colors.light.primary }]} 
                onPress={handleCreateBlock}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Block</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 2,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
});
