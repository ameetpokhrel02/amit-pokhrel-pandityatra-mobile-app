import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/store/notification.store';
import { Notification } from '@/services/notification.service';
import dayjs from 'dayjs';
import { Colors } from '@/theme/colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllRead, deleteNotification } = useNotificationStore();

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
    if (item.type === 'BOOKING' && item.data?.booking_id) {
        router.push(`/(customer)/bookings/${item.data.booking_id}`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).format('MMM DD YYYY, hh:mm a');
    } catch (e) {
      return '';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'BOOKING': return 'calendar-outline';
        case 'ORDER': return 'cart-outline';
        case 'PAYMENT': return 'cash-outline';
        case 'ANNOUNCEMENT': return 'megaphone-outline';
        default: return 'notifications-outline';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationRow, !item.is_read && styles.unreadRow]}
      onPress={() => handleNotifPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons 
            name={getIcon(item.type) as any} 
            size={22} 
            color={Colors.light.primary} 
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.notifTitle, !item.is_read && styles.boldText]}>{item.title}</Text>
          {!item.is_read && <View style={styles.unreadIconDot} />}
        </View>
        <Text style={styles.notifMessage} numberOfLines={3}>{item.message}</Text>
        <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount} Unread</Text>
                    </View>
                )}
            </View>
          </View>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#E5E7EB" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text },
  unreadBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
    alignSelf: 'flex-start'
  },
  unreadBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: 'bold' },
  markReadText: { color: Colors.light.primary, fontWeight: '600', fontSize: 14 },
  listContent: { paddingBottom: 50 },
  notificationRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'flex-start'
  },
  unreadRow: { backgroundColor: '#FFF7ED' },
  iconContainer: { marginRight: 15, paddingTop: 2 },
  iconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  contentContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notifTitle: { fontSize: 16, color: Colors.light.text, flex: 1 },
  boldText: { fontWeight: 'bold' },
  notifMessage: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 8 },
  notifDate: { fontSize: 12, color: '#9CA3AF' },
  unreadIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.primary, marginLeft: 10 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { marginTop: 16, color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
});
