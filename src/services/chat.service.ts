import apiClient from './api-client';
import { ChatRoom, ChatMessage, ChatUser } from '@/types/chat';


// Helper to map API ChatMessage to Frontend ChatMessage
function mapChatMessage(apiMsg: any): ChatMessage {
  return {
    id: apiMsg.id.toString(),
    chatId: apiMsg.room.toString(),
    senderId: apiMsg.sender.toString(),
    text: apiMsg.content || apiMsg.text || '',
    type: (apiMsg.type as any) || 'text',
    timestamp: new Date(apiMsg.created_at || apiMsg.timestamp).getTime(),
    isRead: apiMsg.is_read || false,
    metadata: apiMsg.metadata,
  };
}

// Helper to map API ChatRoom to Frontend ChatRoom
function mapChatRoom(apiRoom: any): ChatRoom {
  return {
    id: apiRoom.id.toString(),
    participants: (apiRoom.participants || []).map((p: any) => ({
      id: p.id.toString(),
      name: p.full_name || p.name || 'User',
      avatar: p.profile_pic_url || p.avatar,
      role: p.role || 'user',
    })),
    lastMessage: apiRoom.last_message_details ? mapChatMessage(apiRoom.last_message_details) : undefined,
    unreadCount: apiRoom.unread_count || 0,
    status: apiRoom.status || 'active',
  };
}

// List chat rooms (optionally filter by booking)
export async function fetchChatRooms(params?: { booking?: number }): Promise<ChatRoom[]> {
  const response = await apiClient.get('/chat/rooms/', { params });
  const data = response.data.results || response.data;
  return Array.isArray(data) ? data.map(mapChatRoom) : [mapChatRoom(data)];
}

// Get messages for a specific room
export async function fetchChatRoomMessages(roomId: string | number): Promise<ChatMessage[]> {
  const response = await apiClient.get(`/chat/rooms/${roomId}/messages/`);
  const data = response.data.results || response.data;
  return Array.isArray(data) ? data.map(mapChatMessage) : [mapChatMessage(data)];
}


// Send a message to a specific room
export async function sendMessage(roomId: string | number, text: string): Promise<ChatMessage> {
  const response = await apiClient.post(`/chat/rooms/${roomId}/messages/`, { content: text });
  return mapChatMessage(response.data);
}

// Get AI suggestion for a response
export async function getAISuggestion(roomId: string | number, lastMessage: string): Promise<ChatMessage> {
  const response = await apiClient.post(`/chat/rooms/${roomId}/ai-suggestion/`, { last_message: lastMessage });
  return mapChatMessage(response.data);
}



// Convenience helper: fetch or create room for a booking (as per web spec)
export async function fetchBookingChatRoom(bookingId: number): Promise<ChatRoom> {
  const response = await apiClient.get('/chat/rooms/', { params: { booking: bookingId } });
  const data = response.data;
  let room;
  if (Array.isArray(data)) {
    room = data[0];
  } else if (data.results && Array.isArray(data.results)) {
    room = data.results[0];
  } else {
    room = data;
  }
  return mapChatRoom(room);
}

// AI Quick Guide Chat
export async function quickChat(message: string): Promise<string> {
  const response = await apiClient.post('/chat/quick-chat/', { message });
  return response.data.response;
}

// WebSocket URL helper
export function getChatWebSocketUrl(bookingId: number, token: string): string {
  // Replace http with ws for the base URL
  const baseUrl = apiClient.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api';
  return `${baseUrl}/ws/puja/${bookingId}/?token=${token}`;
}

