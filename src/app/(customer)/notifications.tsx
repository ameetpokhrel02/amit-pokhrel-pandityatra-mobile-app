import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'order' | 'system';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Booking Confirmed', message: 'Your puja with Pandit G. Sharma is confirmed for tomorrow.', time: '2h ago', read: false, type: 'booking' },
  { id: '2', title: 'Order Shipped', message: 'Your Rudraksha Mala order has been shipped.', time: '5h ago', read: true, type: 'order' },
  { id: '3', title: 'System Update', message: 'New features added to Kundali generator.', time: '1d ago', read: true, type: 'system' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => {/* Handle navigation based on type */}}
    >
      <View style={styles.iconCircle}>
        <Ionicons 
          name={item.type === 'booking' ? 'calendar' : item.type === 'order' ? 'cart' : 'notifications'} 
          size={20} 
          color="#f97316" 
        />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  markReadText: { color: '#f97316', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 15 },
  notificationCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative'
  },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#f97316' },
  iconCircle: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  notifTime: { fontSize: 12, color: '#999' },
  notifMessage: { fontSize: 14, color: '#666', lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginLeft: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});
