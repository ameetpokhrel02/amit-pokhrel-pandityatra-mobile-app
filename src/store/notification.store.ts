import { create } from 'zustand';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '@/services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await fetchNotifications();
      const unreadCount = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await markNotificationAsRead(id);
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      set({ 
        notifications: updatedNotifications, 
        unreadCount: Math.max(0, unreadCount - 1) 
      });
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsAsRead();
      const { notifications } = get();
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications: updatedNotifications, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await deleteNotification(id);
      const { notifications, unreadCount } = get();
      const notification = notifications.find(n => n.id === id);
      const newUnreadCount = notification && !notification.is_read ? Math.max(0, unreadCount - 1) : unreadCount;
      set({ 
        notifications: notifications.filter(n => n.id !== id),
        unreadCount: newUnreadCount
      });
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
    }
  },

  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
