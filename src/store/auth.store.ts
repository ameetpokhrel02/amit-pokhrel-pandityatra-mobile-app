import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'pandit' | 'admin' | 'guest';
  profile_pic_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'customer' | 'pandit' | 'admin' | 'guest';
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setRole: (role: AuthState['role']) => void;
  login: (userData: User, tokens: { access: string; refresh: string }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: 'guest',

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set({ role }),

  login: async (userData, tokens) => {
    try {
      await SecureStore.setItemAsync('access_token', tokens.access);
      await SecureStore.setItemAsync('refresh_token', tokens.refresh);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('role', userData.role);
      
      set({ 
        user: userData, 
        isAuthenticated: true, 
        role: userData.role,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error during login store update:', error);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('role');
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        role: 'guest',
        isLoading: false 
      });
      
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user');
      const roleStr = await SecureStore.getItemAsync('role');
      
      if (accessToken && userStr) {
        set({ 
          user: JSON.parse(userStr), 
          isAuthenticated: true, 
          role: (roleStr as any) || 'customer',
          isLoading: false 
        });
      } else {
        set({ isLoading: false, role: 'guest' });
      }
    } catch (error) {
      console.error('Error during auth initialization:', error);
      set({ isLoading: false, role: 'guest' });
    }
  },
}));
