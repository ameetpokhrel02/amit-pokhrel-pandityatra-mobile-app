import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { fetchProfile } from '@/services/auth.service';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'user' | 'pandit' | 'admin' | 'guest' | undefined;
  profile_pic_url?: string;
  photoUri?: string; // Compatibility
  pandit_profile?: {
    bio?: string;
    expertise?: string;
    experience_years?: number;
    is_verified?: boolean;
    average_rating?: string;
    rating?: string;
    review_count?: number;
    upcoming_bookings?: number;
    pending_bookings?: number;
    total_earnings?: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'customer' | 'user' | 'pandit' | 'admin' | 'guest' | undefined;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setRole: (role: AuthState['role']) => void;
  login: (userData: User, tokens: { access: string; refresh: string }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  syncProfile: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: undefined,

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set({ role }),

  login: async (userData, tokens) => {
    try {
      await SecureStore.setItemAsync('access_token', tokens.access);
      await SecureStore.setItemAsync('refresh_token', tokens.refresh);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      if (userData.role) {
        await SecureStore.setItemAsync('role', userData.role);
      }

      
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
        role: undefined,
        isLoading: false 
      });
      
      router.replace('/(public)/role-selection' as any);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  initialize: async () => {
    console.log('[AuthStore] Initializing...');
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user');
      const roleStr = await SecureStore.getItemAsync('role');
      
      console.log('[AuthStore] Storage check:', { hasToken: !!accessToken, hasUser: !!userStr, role: roleStr });

      if (accessToken && userStr) {
        try {
          const userData = JSON.parse(userStr);
          let initialRole = (roleStr as any) || userData.role || 'customer';
          if (initialRole === 'user') initialRole = 'customer';
          
          set({ 
            user: userData, 
            isAuthenticated: true, 
            role: initialRole,
            isLoading: false 
          });
          console.log('[AuthStore] Initialization success. Syncing profile...');
          get().syncProfile();
        } catch (e) {
          console.error('[AuthStore] Failed to parse user data:', e);
          set({ isLoading: false, role: undefined, isAuthenticated: false, user: null });
        }
      } else if (roleStr === 'guest') {
        console.log('[AuthStore] Clearing persistent Guest session so Welcome screen shows.');
        await SecureStore.deleteItemAsync('role');
        set({ isLoading: false, role: undefined, isAuthenticated: false, user: null });
      } else {
        console.log('[AuthStore] No session found.');
        set({ isLoading: false, role: undefined, isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error('[AuthStore] Error during auth initialization:', error);
      set({ isLoading: false, role: undefined, isAuthenticated: false });
    }
  },
  continueAsGuest: async () => {
    console.log('[AuthStore] Setting role to Guest for current session.');
    set({ role: 'guest', isAuthenticated: false, user: null });
  },
  syncProfile: async () => {
    try {
      const currentRole = get().role;
      console.log(`[AuthStore] Syncing profile with backend (Current Role: ${currentRole})...`);
      
      const response = await fetchProfile();
      const userData = response?.data || response;
      
      if (userData) {
        // If we are already a pandit, and the backend returns a pandit profile, or if the role remains pandit
        let newRole = (userData.role?.toLowerCase() as any) || currentRole || 'customer';
        if (newRole === 'user') newRole = 'customer';
        
        const mappedUser: User = {
          id: String(userData.id),
          name: userData.full_name || userData.name || '',
          phone: userData.phone_number || userData.phone || '',
          email: userData.email || '',
          role: newRole,
          profile_pic_url: userData.profile_pic || userData.profile_image || userData.profile_pic_url,
          photoUri: userData.profile_image || userData.profile_pic_url, // Compatibility
          pandit_profile: userData.pandit_profile,
        };

        console.log('[AuthStore] Profile synced:', { id: mappedUser.id, role: mappedUser.role });

        await SecureStore.setItemAsync('user', JSON.stringify(mappedUser));
        if (mappedUser.role) {
          await SecureStore.setItemAsync('role', mappedUser.role);
        }
        
        set({ 
            user: mappedUser, 
            role: mappedUser.role,
            isAuthenticated: true,
            isLoading: false
        });
      }
    } catch (error: any) {
      console.error('[AuthStore] Profile sync failed:', error.message);
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.log('[AuthStore] Session invalid, logging out.');
        get().logout();
      }
      set({ isLoading: false });
    }
  },
}));

// Compatibility hooks
export const useAuth = () => {
    const store = useAuthStore();
    return {
        user: store.user,
        role: store.role,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        login: store.login,
        logout: store.logout,
    };
};

export const useUser = () => {
    const store = useAuthStore();
    return {
        user: store.user,
        updateUser: async (data: any) => {
            // If it's a metadata update, just use state
            if (store.user) {
                store.setUser({ ...store.user, ...data });
            }
            // Trigger sync if we want to hit backend
            await store.syncProfile();
        },
        logout: store.logout,
    };
};
