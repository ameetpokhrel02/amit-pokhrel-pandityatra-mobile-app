/**
 * Test Infrastructure Validation
 * This test proves the testing setup is working correctly
 */

describe('Test Infrastructure', () => {
  it('should have Jest configured and running', () => {
    expect(jest).toBeDefined();
    expect(typeof jest.fn).toBe('function');
  });

  it('should support async/await', async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('success'), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('success');
  });

  it('should have mocks working', () => {
    const mockFn = jest.fn(() => 'mocked value');
    const result = mockFn();

    expect(mockFn).toHaveBeenCalled();
    expect(result).toBe('mocked value');
  });

  it('should support TypeScript', () => {
    interface TestInterface {
      name: string;
      value: number;
    }

    const testObj: TestInterface = {
      name: 'test',
      value: 123,
    };

    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(123);
  });

  describe('Mock Data', () => {
    it('should have mock data fixtures available', () => {
      const mockData = require('./fixtures/mockData');

      expect(mockData.mockCustomerUser).toBeDefined();
      expect(mockData.mockPanditUser).toBeDefined();
      expect(mockData.mockPujaService).toBeDefined();
      expect(mockData.mockSamagriItems).toBeDefined();
    });
  });

  describe('External Mocks', () => {
    it('should mock expo-location', () => {
      const location = require('expo-location');

      expect(location.requestForegroundPermissionsAsync).toBeDefined();
      expect(location.getCurrentPositionAsync).toBeDefined();
    });

    it('should mock expo-router', () => {
      const router = require('expo-router');

      expect(router.useRouter).toBeDefined();
      expect(router.useLocalSearchParams).toBeDefined();
    });

    it('should mock AsyncStorage', () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      expect(AsyncStorage.getItem || AsyncStorage.default?.getItem).toBeDefined();
      expect(AsyncStorage.setItem || AsyncStorage.default?.setItem).toBeDefined();
    });
  });

  describe('Store Tests', () => {
    it('should be able to import cart store', () => {
      const { useCartStore } = require('@/store/cart.store');

      expect(useCartStore).toBeDefined();
      expect(typeof useCartStore).toBe('function');
    });

    it('should be able to import auth store', () => {
      const { useAuthStore } = require('@/store/auth.store');

      expect(useAuthStore).toBeDefined();
      expect(typeof useAuthStore).toBe('function');
    });
  });
});

describe('Test Environment', () => {
  it('should run in Node environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have console mocked', () => {
    expect(console.warn).toBeDefined();
    expect(console.error).toBeDefined();
  });
});
