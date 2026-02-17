import { ChatMessage, ChatRoom, ChatUser } from '../types/chat';
import { fetchChatRooms, fetchChatRoomMessages } from './api';

// NOTE:
// This service now uses real backend APIs (/api/chat/rooms/ and /api/chat/rooms/{id}/messages/)
// to match the web implementation. AI suggestions remain local-only for now.

// Current user is still mocked on the client side; backend controls actual roles/IDs.
const CURRENT_USER: ChatUser = { id: 'me', name: 'Me', role: 'customer' };

export const ChatService = {
  // Map backend ChatRoom to mobile ChatRoom shape
  getChats: async (): Promise<ChatRoom[]> => {
    const rooms = await fetchChatRooms();

    return rooms.map((room: any) => {
      const participants: ChatUser[] =
        room.participants?.map((p: any) => ({
          id: String(p.id),
          name: p.name || p.full_name || 'User',
          avatar: p.avatar || p.profile_pic || undefined,
          role: p.role || 'customer',
        })) || [];

      const last = room.last_message || room.lastMessage;

      const lastMessage: ChatMessage | undefined = last
        ? {
            id: String(last.id),
            chatId: String(room.id),
            senderId: String(last.sender),
            text: last.text || last.message || '',
            type: 'text',
            timestamp: new Date(last.created_at || last.timestamp).getTime(),
            isRead: !!last.is_read,
          }
        : undefined;

      return {
        id: String(room.id),
        participants,
        unreadCount: room.unread_count ?? 0,
        status: room.status || 'active',
        context: {
          ritualType: room.context?.ritualType || room.ritual_type,
          date: room.context?.date || room.date,
          location: room.context?.location || room.location,
        },
        lastMessage,
      };
    });
  },

  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    const data = await fetchChatRoomMessages(Number(chatId));

    return data.map((m: any) => ({
      id: String(m.id),
      chatId: String(m.room || chatId),
      senderId: String(m.sender || m.sender_id),
      text: m.text || m.message || '',
      type: m.type === 'system' ? 'system' : 'text',
      timestamp: new Date(m.created_at || m.timestamp).getTime(),
      isRead: !!m.is_read,
    }));
  },

  // Placeholder: requires backend POST endpoint to send messages
  sendMessage: async (chatId: string, text: string): Promise<ChatMessage> => {
    const now = Date.now();

    // Optimistic local echo; in the future, replace with real POST /chat/...
    return {
      id: 'local_' + now,
      chatId,
      senderId: CURRENT_USER.id,
      text,
      type: 'text',
      timestamp: now,
      isRead: true,
    };
  },

  // Local AI suggestion logic kept as-is (no backend dependency)
  getAISuggestion: async (chatId: string, lastMessageText: string): Promise<ChatMessage | null> => {
    const lowerText = lastMessageText.toLowerCase();

    if (lowerText.includes('available') || lowerText.includes('date')) {
      return {
        id: 'ai_' + Date.now(),
        chatId,
        senderId: 'ai',
        text: 'Suggested: "Pandit ji, will you arrange samagri or should we provide it?"',
        type: 'ai_suggestion',
        timestamp: Date.now(),
        isRead: true,
        metadata: { suggestionAction: 'ask_samagri' },
      };
    }

    if (lowerText.includes('samagri')) {
      return {
        id: 'ai_' + Date.now(),
        chatId,
        senderId: 'ai',
        text: 'Suggested: "What is the total dakshina for this ritual?"',
        type: 'ai_suggestion',
        timestamp: Date.now(),
        isRead: true,
      };
    }

    return null;
  },
};
