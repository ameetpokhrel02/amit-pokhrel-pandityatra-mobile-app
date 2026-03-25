export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'pandit' | 'system' | 'ai';
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'system' | 'ai_suggestion';
  timestamp: number;
  isRead: boolean;
  products?: any[]; // Array of SamagriItem or similar
  metadata?: {
    suggestionAction?: string; // e.g., 'book_now', 'confirm_date'
  };
}

export interface ChatRoom {
  id: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  status: 'active' | 'archived';
  context?: {
    ritualType?: string;
    date?: string;
    location?: string;
  };
}
