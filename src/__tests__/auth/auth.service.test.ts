import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import * as AuthService from '@/services/auth.service';
import * as mockData from '../fixtures/mockData';

describe('AuthService', () => {
  beforeEach(() => {
    setupAPIMocks();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  describe('sendOTP', () => {
    it('should send OTP to valid phone number', async () => {
      const phoneNumber = '+9779812345678';
      const result = await AuthService.sendOTP(phoneNumber);

      expect(result).toEqual(mockData.mockOTPResponse);
      expect(result.phone_number).toBe(phoneNumber);
    });

    it('should handle invalid phone number', async () => {
      const invalidPhone = 'invalid';

      try {
        await AuthService.sendOTP(invalidPhone);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP and return user data with tokens', async () => {
      const phoneNumber = '+9779812345678';
      const otp = '123456';

      const result = await AuthService.verifyOTP(phoneNumber, otp);

      expect(result).toEqual(mockData.mockOTPVerifyResponse);
      expect(result.access).toBe('mock-access-token');
      expect(result.user).toEqual(mockData.mockCustomerUser);
    });

    it('should reject invalid OTP', async () => {
      const phoneNumber = '+9779812345678';
      const invalidOTP = '000000';

      try {
        await AuthService.verifyOTP(phoneNumber, invalidOTP);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('googleLogin', () => {
    it('should authenticate with Google and return user data', async () => {
      const idToken = 'mock-google-id-token';

      const result = await AuthService.googleLogin(idToken);

      expect(result).toEqual(mockData.mockGoogleAuthResponse);
      expect(result.access).toBe('mock-google-access-token');
      expect(result.user).toEqual(mockData.mockCustomerUser);
    });

    it('should handle Google auth failure', async () => {
      const invalidToken = '';

      try {
        await AuthService.googleLogin(invalidToken);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
