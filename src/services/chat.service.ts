import apiClient from './api-client';
import { ChatRoom, ChatMessage, ChatUser } from '@/types/chat';


// Helper to map API ChatMessage to Frontend ChatMessage
function mapChatMessage(apiMsg: any): ChatMessage {
  if (!apiMsg) return {} as ChatMessage;
  return {
    id: String(apiMsg.id || ''),
    chatId: String(apiMsg.room || apiMsg.chat_id || ''),
    senderId: String(apiMsg.sender || apiMsg.sender_id || ''),
    text: apiMsg.content || apiMsg.text || '',
    type: (apiMsg.type as any) || 'text',
    timestamp: new Date(apiMsg.created_at || apiMsg.timestamp || Date.now()).getTime(),
    isRead: apiMsg.is_read || apiMsg.read || false,
    metadata: apiMsg.metadata,
  };
}

// Helper to map API ChatRoom to Frontend ChatRoom
function mapChatRoom(apiRoom: any): ChatRoom {
  if (!apiRoom) return {} as ChatRoom;
  return {
    id: String(apiRoom.id || ''),
    participants: (apiRoom.participants || []).map((p: any) => ({
      id: String(p.id || ''),
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

// AI Mode: Ritual Guide (Suggestions/Initial)
export async function fetchAiGuide(): Promise<string> {
  const response = await apiClient.get('ai/guide/');
  return response.data.response || response.data.message || response.data.detail;
}

// AI Mode: General AI Chat
export async function generalAiChat(message: string): Promise<string> {
  const response = await apiClient.post('ai/chat/', { message });
  return response.data.response || response.data.message;
}

// AI Quick Guide Chat (Existing legacy helper)
export async function quickChat(message: string): Promise<string> {
  const response = await apiClient.post('chat/quick-chat/', { message });
  return response.data.response;
}

// WebSocket URL helper
export function getChatWebSocketUrl(roomId: string | number, token: string): string {
  // Replace http with ws for the base URL
  const baseUrl = apiClient.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api';
  return `${baseUrl}/ws/chat/${roomId}/?token=${token}`;
}

