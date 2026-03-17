import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/store/notification.store';
import { Notification } from '@/services/notification.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllRead, deleteNotification } = useNotificationStore();

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleNotifPress = async (item: Notification) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    // Handle navigation based on type if needed
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return dayjs(dateString).fromNow();
    } catch (e) {
      return 'just now';
    }
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotifPress(item)}
      >
        <View style={styles.iconCircle}>
          <Ionicons 
            name={item.type === 'BOOKING' ? 'calendar' : item.type === 'ORDER' ? 'cart' : 'notifications'} 
            size={20} 
            color="#f97316" 
          />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifTime}>{getTimeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
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
    flex: 1,
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
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginHorizontal: 10 },
  cardContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  deleteBtn: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});
