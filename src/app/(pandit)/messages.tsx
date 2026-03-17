import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchChatRooms } from '@/services/chat.service';
import { ChatRoom } from '@/types/chat';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';

export default function PanditMessagesScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchChatRooms();
        setRooms(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: ChatRoom }) => {
    const otherParticipant = item.participants.find(p => p.role === 'customer');
    const name = otherParticipant?.name || 'Customer';
    const avatar = otherParticipant?.avatar ? getImageUrl(otherParticipant.avatar) : undefined;
    const lastText = item.lastMessage?.text || 'Start a conversation';
    const lastTime = item.lastMessage?.timestamp
      ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/(customer)/chat/${item.id}` as any)}
      >
        <Image
          source={{ uri: avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.userName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.time, { color: isDark ? '#AAA' : '#999' }]}>{lastTime}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: isDark ? '#AAA' : '#666' }]} numberOfLines={1}>
              {lastText}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={isDark ? '#666' : '#ccc'} />
              <Text style={[styles.emptyText, { color: isDark ? '#AAA' : '#999' }]}>No messages yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchBtn: { padding: 5 },
  listContent: { padding: 15 },
  chatCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  userName: { fontSize: 17, fontWeight: 'bold', color: '#3E2723' },
  time: { fontSize: 12, color: '#999' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#666', flex: 1, marginRight: 10 },
  unreadBadge: { backgroundColor: '#f97316', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});
