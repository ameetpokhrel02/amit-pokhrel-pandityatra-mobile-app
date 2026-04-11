import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
// import { router } from 'expo-router'; // Removed to centralize navigation in layouts
import { fetchProfile } from '@/services/auth.service';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'pandit' | 'admin' | 'vendor' | 'guest';
  profile_pic_url?: string;
  photoUri?: string | null;
  pandit_profile?: {
    id: number;
    bio: string;
    is_verified: boolean;
    is_available: boolean;
    average_rating: string;
    review_count: number;
    experience_years: number;
    rating?: string;
    skills?: string[];
    pending_bookings?: number;
    upcoming_bookings?: number;
    total_earnings?: number;
  };
  vendor_profile?: {
    id: number;
    shop_name: string;
    business_type: string;
    city: string;
    is_verified: boolean;
    balance: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'customer' | 'pandit' | 'admin' | 'vendor' | 'guest';
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setRole: (role: AuthState['role']) => void;
  login: (userData: User, tokens: { access: string; refresh: string }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  syncProfile: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: 'guest',

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set({ role }),
  updateUser: (partial) => set((state) => ({
    user: state.user ? { ...state.user, ...partial } : null,
  })),

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

      // Navigation is now handled by _layout.tsx based on state changes
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
        // Sync profile in background after immediate UI update
        get().syncProfile();
      } else {
        set({ isLoading: false, role: 'guest' });
      }
    } catch (error) {
      console.error('Error during auth initialization:', error);
      set({ isLoading: false, role: 'guest' });
    }
  },

  syncProfile: async () => {
    try {
      const response = await fetchProfile();
      const userData = response.data;
      if (userData) {
        // Map backend profile response to store User type
        const mappedUser: User = {
          id: userData.id?.toString() || '',
          name: userData.full_name || userData.name || '',
          phone: userData.phone_number || userData.phone || '',
          email: userData.email,
          role: userData.role || 'customer',
          profile_pic_url: userData.profile_pic,
          pandit_profile: userData.pandit_profile,
          vendor_profile: userData.vendor_profile,
        };
        await SecureStore.setItemAsync('user', JSON.stringify(mappedUser));
        await SecureStore.setItemAsync('role', mappedUser.role);
        set({ user: mappedUser, role: mappedUser.role });
      }
    } catch (error: any) {
      if (error.response) {
        console.error('Profile sync failed:', {
          status: error.response.status,
          data: error.response.data,
        });
        
        // If the token is invalid/blacklisted, log out immediately
        if (error.response.status === 401) {
          get().logout();
        }
      } else {
        console.error('Error during profile sync:', error);
      }
    }
  },
  continueAsGuest: async () => {
    try {
      await SecureStore.setItemAsync('role', 'guest');
      set({ user: null, isAuthenticated: false, role: 'guest', isLoading: false });
    } catch (error) {
      console.error('Error during continueAsGuest:', error);
    }
  },
}));

// Convenience alias — edit-profile.tsx and PanditChatView.tsx import this
export const useUser = useAuthStore;