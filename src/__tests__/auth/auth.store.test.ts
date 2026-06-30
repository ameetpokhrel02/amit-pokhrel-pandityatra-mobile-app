import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/store/auth.store';
import * as SecureStore from 'expo-secure-store';
import * as mockData from '../fixtures/mockData';

jest.mock('expo-secure-store');

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should set user and tokens on successful login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(
          mockData.mockCustomerUser,
          'access-token',
          'refresh-token'
        );
      });

      expect(result.current.user).toEqual(mockData.mockCustomerUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'access_token',
        'access-token'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token'
      );
    });

    it('should set correct role-based flags for customer', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockData.mockCustomerUser, 'token', 'refresh');
      });

      expect(result.current.isCustomer).toBe(true);
      expect(result.current.isPandit).toBe(false);
    });

    it('should set correct role-based flags for pandit', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockData.mockPanditUser, 'token', 'refresh');
      });

      expect(result.current.isCustomer).toBe(false);
      expect(result.current.isPandit).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user data and tokens', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      act(() => {
        result.current.login(mockData.mockCustomerUser, 'token', 'refresh');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('updateUser', () => {
    it('should update user profile data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockData.mockCustomerUser, 'token', 'refresh');
      });

      const updatedData = {
        full_name: 'Updated Name',
        phone_number: '+9779800000000',
      };

      act(() => {
        result.current.updateUser(updatedData);
      });

      expect(result.current.user?.full_name).toBe('Updated Name');
      expect(result.current.user?.phone_number).toBe('+9779800000000');
    });

    it('should not update if no user is logged in', () => {
      const { result } = renderHook(() => useAuthStore());

      const updatedData = { full_name: 'Should Not Update' };

      act(() => {
        result.current.updateUser(updatedData);
      });

      expect(result.current.user).toBeNull();
    });
  });
});
