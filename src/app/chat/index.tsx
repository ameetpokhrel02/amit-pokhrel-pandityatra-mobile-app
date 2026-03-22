import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { fetchChatRooms } from '@/services/chat.service';
import { ChatRoom } from '@/types/chat';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import { useAuthStore } from '@/store/auth.store';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { role, user } = useAuthStore();
  const isDark = theme === 'dark';
  const isPandit = role === 'pandit';
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await fetchChatRooms();
      setChats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatRoom }) => {
    // Find the participant that is NOT me
    const otherParticipant = item.participants.find(p => String(p.id) !== String(user?.id)) || item.participants[0];

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
        onPress={() => router.push(`/chat/${item.id}` as any)}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant?.avatar ? (
            <Image source={{ uri: getImageUrl(otherParticipant.avatar) || '' }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{otherParticipant?.name.charAt(0)}</Text>
            </View>
          )}
          {item.unreadCount > 0 && <View style={[styles.badge, { borderColor: colors.card }]} />}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: colors.text }]}>{otherParticipant?.name}</Text>
            <Text style={[styles.time, { color: isDark ? '#AAA' : '#999' }]}>
              {item.lastMessage ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>

          <Text style={[styles.contextText, { color: colors.primary }]}>
            {item.context?.ritualType} • {item.context?.location}
          </Text>

          <Text style={[styles.messagePreview, { color: isDark ? '#AAA' : '#666' }, item.unreadCount > 0 && { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
            {item.lastMessage?.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#f0f0f0' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
      </View>

      {!isPandit && (
        <TouchableOpacity
          style={[styles.aiGuideCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          onPress={() => router.push('/chat/ai-guide?mode=ai' as any)}
        >
          <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={24} color="#FFF" />
          </View>
          <View style={styles.aiContent}>
            <Text style={[styles.aiTitle, { color: colors.text }]}>AI Ritual Guide</Text>
            <Text style={[styles.aiSubtitle, { color: isDark ? '#AAA' : '#666' }]}>Ask anything about pujas & rituals</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="message.fill" size={48} color={isDark ? '#666' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#AAA' : '#999' }]}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  aiGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiSubtitle: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  contextText: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  messagePreview: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
