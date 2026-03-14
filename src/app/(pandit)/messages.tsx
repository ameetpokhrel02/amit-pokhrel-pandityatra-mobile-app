import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ChatRoom {
  id: string;
  userName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  userAvatar: string;
}

const MOCK_CHATS: ChatRoom[] = [
  { id: '1', userName: 'Ameet Pokhrel', lastMessage: 'Namaste Pandit ji, what should I prepare for tomorrow?', time: '10:30 AM', unreadCount: 2, userAvatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
  { id: '2', userName: 'Sita Sharma', lastMessage: 'Thank you for the wonderful puja yesterday.', time: 'Yesterday', unreadCount: 0, userAvatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png' },
];

export default function PanditMessagesScreen() {
  const router = useRouter();
  const [chats, setChats] = useState(MOCK_CHATS);

  const renderItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => router.push(`/(customer)/chat/${item.id}` as any)} // Reuse shared chat room
    >
      <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
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
