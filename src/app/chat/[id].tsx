import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/theme/colors';
import { fetchChatRoomMessages, getAISuggestion, fetchChatRooms } from '@/services/chat.service';
import { ChatMessage, ChatRoom } from '@/types/chat';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { getImageUrl } from '@/utils/image';
import { useChatSocket } from '@/hooks/useChatSocket';
import { sendAiChatMessage } from '@/services/ai.service';
import { useCartStore } from '@/store/cart.store';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

// Product Card for Chat
const ChatProductCard = ({ product, colors, isDark }: { product: any, colors: any, isDark: boolean }) => {
  const addToCart = useCartStore(state => state.addToCart);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description
    } as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#F0F0F0' }]}>
      <Image 
        source={{ uri: getImageUrl(product.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }} 
        style={styles.productImage} 
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>Rs. {product.price}</Text>
        <TouchableOpacity 
          style={[styles.addToCartButton, { backgroundColor: added ? '#4CAF50' : colors.primary }]}
          onPress={handleAddToCart}
        >
          <Ionicons name={added ? "checkmark" : "cart-outline"} size={14} color="#FFF" />
          <Text style={styles.addToCartText}>{added ? 'ADDED' : 'ADD TO CART'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChatRoomScreen() {
  const { id, mode } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isAiMode = mode === 'ai' || id === 'ai-guide';
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user, role } = useAuthStore();
  const isDark = theme === 'dark';
  const isPandit = role === 'pandit';
  
  // Real-time Socket Setup
  const { 
    messages: socketMessages, 
    status, 
    isTyping: socketIsTyping, 
    sendMessage: sendSocketMessage,
    manualRefresh 
  } = useChatSocket(!isAiMode && typeof id === 'string' ? id : undefined);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(!isAiMode);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<ChatMessage | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const messages = isAiMode ? localMessages : socketMessages;
  const otherParticipant = room?.participants.find(p => String(p.id) !== String(user?.id));

  useEffect(() => {
    if (isAiMode) {
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
      const rooms = await fetchChatRooms();
      const currentRoom = rooms.find(r => String(r.id) === String(id));
      if (currentRoom) {
        setRoom(currentRoom);
      }

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
      
      setIsAiTyping(true);
      try {
        const response = await sendAiChatMessage(text);
        if (response) {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                chatId: 'ai-guide',
                senderId: 'ai',
                text: response.text || response.response || response.message || 'I am processing your request...',
                type: 'text',
                timestamp: Date.now(),
                isRead: true,
                products: response.products || []
            };
            setLocalMessages(prev => [...prev, aiMsg]);
        }
      } catch (err) {
        console.error('AI Chat Error:', err);
      } finally {
        setIsAiTyping(false);
      }
    } else {
      if (typeof id !== 'string') return;
      setInputText('');
      setAiSuggestion(null);

      try {
        await sendSocketMessage(text);
      } catch (error) {
        console.error('Failed to send', error);
      }
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

    const isMe = String(item.senderId) === String(user?.id);
    const isAi = String(item.senderId) === 'ai';

    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
          { flexDirection: 'row', alignItems: 'flex-end' }
        ]}>
          {!isMe && (
            <View style={[styles.messageAvatar, { backgroundColor: isAi ? '#FFF' : '#F0F0F0', borderWidth: isAi ? 1 : 0, borderColor: colors.primary + '30' }]}>
              {isAi ? (
                <MaterialCommunityIcons name="robot-outline" size={16} color={colors.primary} />
              ) : (
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text }}>
                  {otherParticipant?.name?.charAt(0) || 'P'}
                </Text>
              )}
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } : { backgroundColor: isDark ? '#333' : '#F0F0F0', borderBottomLeftRadius: 4 },
            isMe ? styles.myMessage : styles.theirMessage
          ]}>
            <Text style={[styles.messageText, isMe ? styles.myMessageText : { color: colors.text }]}>
              {item.text}
            </Text>
            <Text style={[styles.timestamp, isMe ? styles.myTimestamp : { color: isDark ? '#AAA' : '#999' }]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {isMe && (
            <View style={[styles.messageAvatar, { backgroundColor: colors.primary }]}>
              {user?.profile_pic_url ? (
                <Image source={{ uri: getImageUrl(user.profile_pic_url) || undefined }} style={styles.messageAvatarImage} />
              ) : (
                <Ionicons name="person" size={14} color="#FFF" />
              )}
            </View>
          )}
        </View>
        
        {item.products && item.products.length > 0 && (
          <View style={[styles.productListContainer, { marginLeft: !isMe ? 44 : -16 }]}>
             <FlatList
               data={item.products}
               horizontal
               showsHorizontalScrollIndicator={false}
               renderItem={({ item: prod }) => (
                 <ChatProductCard product={prod} colors={colors} isDark={isDark} />
               )}
               keyExtractor={(prod, index) => `${prod.product_id || prod.id || index}`}
               contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
             />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.card, 
          borderBottomColor: isDark ? '#333' : '#f0f0f0',
          paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 8)
        }
      ]}>
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
                <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                    {otherParticipant.role === 'pandit' ? 'Pandit' : 'Customer'}
                  </Text>
                </View>
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

          {!isAiMode && (
            <TouchableOpacity onPress={manualRefresh} style={styles.refreshIcon}>
              <Ionicons name="refresh" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isAiTyping || socketIsTyping ? <TypingIndicator /> : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: colors.card, 
            borderTopColor: isDark ? '#333' : '#f0f0f0',
            paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
            paddingTop: 12
          }
        ]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    marginLeft: -8,
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
    marginTop: 4,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 18,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
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
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
  },
  messageAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
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
    paddingHorizontal: 20,
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
  refreshIcon: {
    padding: 8,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 8,
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  productListContainer: {
    width: Dimensions.get('window').width,
    marginLeft: -16,
    marginTop: 8,
    marginBottom: 16,
  },
  productCard: {
    width: 160,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  productImage: {
    width: '100%',
    height: 100,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
