import apiClient from './api-client';
import { ChatRoom, ChatMessage, ChatUser } from '@/types/chat';


// Helper to map API ChatMessage to Frontend ChatMessage
function mapChatMessage(apiMsg: any): ChatMessage {
  if (!apiMsg) return {} as ChatMessage;
  return {
    id: String(apiMsg.id || ''),
    chatId: String(apiMsg.chat_room || apiMsg.room || apiMsg.chat_id || ''),
    senderId: String(apiMsg.sender_obj?.id || apiMsg.sender || apiMsg.sender_id || ''),
    text: apiMsg.content || apiMsg.text || '',
    type: (apiMsg.message_type?.toLowerCase() as any) || (apiMsg.type as any) || 'text',
    timestamp: new Date(apiMsg.created_at || apiMsg.timestamp || Date.now()).getTime(),
    isRead: apiMsg.is_read || apiMsg.read || false,
    products: apiMsg.products || [], // Added
    metadata: apiMsg.metadata,
  };
}

// Helper to map API ChatRoom to Frontend ChatRoom
function mapChatRoom(apiRoom: any): ChatRoom {
  if (!apiRoom) return {} as ChatRoom;

  const participants: ChatUser[] = [];
  
  // Map Customer
  if (apiRoom.customer) {
    participants.push({
      id: String(apiRoom.customer.id || ''),
      name: apiRoom.customer.full_name || apiRoom.customer.username || 'Customer',
      avatar: apiRoom.customer.profile_pic,
      role: 'customer'
    });
  }
  
  // Map Pandit
  const panditUser = apiRoom.pandit?.user;
  if (panditUser) {
    participants.push({
      id: String(panditUser.id || ''),
      name: panditUser.full_name || panditUser.username || 'Pandit',
      avatar: panditUser.profile_pic,
      role: 'pandit'
    });
  }

  // Fallback for legacy/other participants array
  if (apiRoom.participants && Array.isArray(apiRoom.participants)) {
    apiRoom.participants.forEach((p: any) => {
      if (!participants.find(existing => existing.id === String(p.id))) {
        participants.push({
          id: String(p.id || ''),
          name: p.full_name || p.name || p.username || 'User',
          avatar: p.profile_pic || p.profile_pic_url || p.avatar,
          role: p.role || 'user',
        });
      }
    });
  }

  return {
    id: String(apiRoom.id || ''),
    participants,
    lastMessage: apiRoom.last_message_details ? mapChatMessage(apiRoom.last_message_details) : (apiRoom.last_message ? {
        id: `last-${apiRoom.id}`,
        chatId: String(apiRoom.id),
        senderId: '',
        text: apiRoom.last_message,
        type: 'text',
        timestamp: new Date(apiRoom.last_message_time || Date.now()).getTime(),
        isRead: false,
        products: apiRoom.products || [], // Added
    } as ChatMessage : undefined),
    unreadCount: typeof apiRoom.unread_count === 'string' ? parseInt(apiRoom.unread_count) : (apiRoom.unread_count || 0),
    status: apiRoom.is_active !== false ? 'active' : 'archived',
  };
}

// List chat rooms (optionally filter by booking)
export async function fetchChatRooms(params?: { booking?: number }): Promise<ChatRoom[]> {
  const response = await apiClient.get('chat/rooms/', { params });
  const data = response.data.results || response.data;
  return Array.isArray(data) ? data.map(mapChatRoom) : [mapChatRoom(data)];
}

// Get messages for a specific room
export async function fetchChatRoomMessages(roomId: string | number): Promise<ChatMessage[]> {
  const response = await apiClient.get(`chat/rooms/${roomId}/messages/`);
  const data = response.data.results || response.data;
  return Array.isArray(data) ? data.map(mapChatMessage) : [mapChatMessage(data)];
}


// Send a message to a specific room
export async function sendMessage(roomId: string | number, text: string): Promise<ChatMessage> {
  const response = await apiClient.post(`chat/rooms/${roomId}/messages/`, { content: text });
  return mapChatMessage(response.data);
}

// Get AI suggestion for a response
export async function getAISuggestion(roomId: string | number, lastMessage: string): Promise<ChatMessage> {
  const response = await apiClient.post(`chat/rooms/${roomId}/ai-suggestion/`, { last_message: lastMessage });
  return mapChatMessage(response.data);
}

// Initiate a chat room (e.g. from Pandit Profile)
export async function initiateChat(panditId: number): Promise<ChatRoom> {
  const response = await apiClient.post('chat/rooms/initiate/', { pandit_id: panditId });
  return mapChatRoom(response.data);
}

// WebSocket URL helper
export function getChatWebSocketUrl(roomId: string | number, token: string): string {
  // Replace http with ws for the base URL and handle standard Django Channels path
  const baseUrl = apiClient.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api';
  // Note: Backend expectation is ws://<host>/ws/chat/{roomId}/?token=<jwt>
  return `${baseUrl.replace('/api/', '')}/ws/chat/${roomId}/?token=${token}`;
}

