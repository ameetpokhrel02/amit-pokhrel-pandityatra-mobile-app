import { create } from 'zustand';

interface ChatState {
  chatVisible: boolean;
  bookingId?: number;
  panditName?: string;
  
  // Actions
  openChat: (bookingId?: number, panditName?: string) => void;
  closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatVisible: false,
  bookingId: undefined,
  panditName: undefined,

  openChat: (bookingId, panditName) => set({ 
    chatVisible: true, 
    bookingId, 
    panditName 
  }),

  closeChat: () => set({ chatVisible: false }),
}));
