import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/theme/colors';
import { fetchChatRoomMessages, sendMessage, getAISuggestion, fetchChatRooms } from '@/services/chat.service';
import { ChatMessage, ChatRoom } from '@/types/chat';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { getImageUrl } from '@/utils/image';
import { useChatSocket } from '@/hooks/useChatSocket';
import { sendAiChatMessage } from '@/services/ai.service';

export default function ChatRoomScreen() {
  const { id, mode } = useLocalSearchParams();
  const isAiMode = mode === 'ai' || id === 'ai-guide';
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user, role } = useAuthStore();
  const isDark = theme === 'dark';
  const isPandit = role === 'pandit';
  const { messages: socketMessages, status, manualRefresh } = useChatSocket(!isAiMode && typeof id === 'string' ? id : undefined);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(!isAiMode);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const messages = isAiMode ? localMessages : socketMessages;

  useEffect(() => {
    if (isAiMode) {
      // AI Guide initial message
      setLocalMessages([{
        id: 'ai-initial',
        chatId: 'ai-guide',
        senderId: 'ai',
        text: 'Namaste! I am your AI Spiritual Guide. Ask me anything about pujas, rituals, or samagri.',
        type: 'text',
        timestamp: Date.now(),
        isRead: true
      }]);
    } else {
      loadRoomDetails();
    }
  }, [id, isAiMode]);

  const loadRoomDetails = async () => {
    if (typeof id !== 'string' || isAiMode) return;
    try {
      // Fetch room details to get the participant name
      const rooms = await fetchChatRooms();
      const currentRoom = rooms.find(r => String(r.id) === String(id));
      if (currentRoom) {
        setRoom(currentRoom);
      }

      // Check for AI suggestion based on last message (only for customers)
      if (!isPandit && socketMessages.length > 0) {
        const lastMsg = socketMessages[socketMessages.length - 1];
        if (lastMsg.senderId !== String(user?.id)) {
          const suggestion = await getAISuggestion(id, lastMsg.text);
          setAiSuggestion(suggestion);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    if (isAiMode) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        chatId: 'ai-guide',
        senderId: String(user?.id || 'guest'),
        text: text,
        type: 'text',
        timestamp: Date.now(),
        isRead: true
      };
      setLocalMessages(prev => [...prev, userMsg]);
      setInputText('');

      try {
        const aiRes = await sendAiChatMessage(text);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          chatId: 'ai-guide',
          senderId: 'ai',
          text: aiRes.response || aiRes.message || 'I am sorry, I am having trouble processing your request.',
          type: 'text',
          timestamp: Date.now(),
          isRead: true
        };
        setLocalMessages(prev => [...prev, aiMsg]);
      } catch (e) {
        console.error('AI chat failed', e);
      }
      return;
    }

    if (typeof id !== 'string') return;
    setInputText('');
    setAiSuggestion(null);

    try {
      await sendMessage(id, text);
    } catch (error) {
      console.error('Failed to send', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type?.toLowerCase() === 'system') {
      return (
        <View style={[styles.systemMessageContainer, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
          <IconSymbol name="info.circle" size={16} color={isDark ? '#AAA' : '#666'} />
          <Text style={[styles.systemMessageText, { color: isDark ? '#AAA' : '#666' }]}>{item.text}</Text>
        </View>
      );
    }

    // Check if it's 'my' message. 
    const isMe = String(item.senderId) === String(user?.id);

    return (
      <View style={[
        styles.messageBubble,
        isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } : { backgroundColor: isDark ? '#333' : '#F0F0F0', borderBottomLeftRadius: 4 },
        isMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMe ? styles.myMessageText : { color: colors.text }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          isMe ? styles.myTimestamp : { color: isDark ? '#AAA' : '#999' }
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const otherParticipant = room?.participants.find(p => String(p.id) !== String(user?.id));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#f0f0f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerProfileContainer}>
          {isAiMode ? (
            <View style={[styles.avatar, styles.aiAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={20} color="#FFF" />
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              {otherParticipant?.avatar ? (
                <Image 
                  source={{ uri: getImageUrl(otherParticipant.avatar) || undefined }} 
                  style={styles.avatar} 
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{otherParticipant?.name?.charAt(0) || '?'}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {isAiMode ? 'AI Ritual Guide' : (otherParticipant?.name || 'Chat')}
            </Text>
            <View style={styles.headerSubtitleRow}>
              {!isAiMode && otherParticipant && (
                <Text style={[styles.roleBadge, { color: colors.primary }]}>
                  {otherParticipant.role === 'pandit' ? 'Pandit' : 'Customer'}
                </Text>
              )}
              {!isAiMode && (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? '#4CAF50' : '#F44336' }]} />
                  <Text style={[styles.statusText, { color: status === 'connected' ? '#4CAF50' : '#F44336' }]}>
                    {status === 'connected' ? 'Online' : 'Offline'}
                  </Text>
                </View>
              )}
              {isAiMode && (
                <Text style={[styles.statusText, { color: '#4CAF50' }]}>Available 24/7</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {!isPandit && aiSuggestion && (
        <View style={[styles.suggestionContainer, { backgroundColor: isDark ? '#332' : '#FFF9F0', borderTopColor: isDark ? '#443' : '#FFE0B2' }]}>
          <View style={styles.suggestionHeader}>
            <IconSymbol name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.suggestionTitle, { color: colors.primary }]}>AI Suggestion</Text>
          </View>
          <TouchableOpacity
            style={[styles.suggestionBubble, { backgroundColor: colors.card, borderColor: isDark ? '#443' : '#FFE0B2' }]}
            onPress={() => handleSend(aiSuggestion.text.replace('Suggested: ', '').replace(/"/g, ''))}
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {aiSuggestion.text.replace('Suggested: ', '').replace(/"/g, '')}
            </Text>
            <IconSymbol name="arrow.up.circle.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#f0f0f0' }]}>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#333' : '#F5F5F5', color: colors.text }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? '#AAA' : '#999'}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
        >
          <IconSymbol name="paperplane.fill" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerProfileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  aiAvatar: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    marginVertical: 16,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 12,
    marginLeft: 6,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  suggestionContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  suggestionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
