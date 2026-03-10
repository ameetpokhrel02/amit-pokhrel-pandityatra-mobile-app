import apiClient, { publicApi, saveTokens } from './api-client';

export interface RegisterPayload {
  full_name: string;
  phone_number: string;
  email?: string;
  password?: string;
  role?: 'user' | 'pandit';
}

// Helper to standardize error messages (internal to auth for now, or move to utils)
function handleApiError(error: any) {
  if (error.response) {
    const data = error.response.data;
    if (data.detail) return new Error(data.detail);
    if (data.message) return new Error(data.message);
    if (typeof data === 'object') {
      const fieldErrors = Object.entries(data)
        .map(([field, errors]: [string, any]) => {
          const errorList = Array.isArray(errors) ? errors : [errors];
          return `${field}: ${errorList.join(', ')}`;
        })
        .join('; ');
      return new Error(fieldErrors);
    }
  }
  return error;
}

export async function registerUser(payload: RegisterPayload) {
  try {
    const response = await publicApi.post('/users/register/', payload);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function requestLoginOtp(payload: { phone_number?: string; email?: string }) {
  try {
    const response = await publicApi.post('/users/request-otp/', payload);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function verifyOtpAndGetToken(payload: { phone_number?: string; email?: string; otp_code: string }) {
  try {
    const response = await publicApi.post('/users/login-otp/', payload);
    const { access, refresh } = response.data;
    if (access && refresh) {
      await saveTokens(access, refresh);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function passwordLogin(payload: { phone_number?: string; email?: string; username?: string; password: string }) {
  try {
    const response = await publicApi.post('/users/login-password/', payload);
    const { access, refresh } = response.data;
    if (access && refresh) {
      await saveTokens(access, refresh);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function googleLogin(idToken: string) {
  try {
    const response = await publicApi.post('/users/google-login/', { id_token: idToken });
    const { access, refresh } = response.data;
    // Backend returns 'access' or 'token' sometimes based on logs/code, 
    // but standard JWT is access/refresh
    const accessToken = access || response.data.token;
    if (accessToken && refresh) {
      await saveTokens(accessToken, refresh);
    }
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function fetchProfile() {
  const response = await apiClient.get('/users/profile/');
  return response.data;
}

export async function requestPasswordResetOtp(payload: { email: string }) {
  try {
    const response = await publicApi.post('/users/forgot-password/', payload);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function verifyPasswordResetOtp(payload: { email: string; otp: string }) {
  try {
    const response = await publicApi.post('/users/forgot-password/verify-otp/', payload);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function resetPasswordWithToken(payload: { token: string; new_password: string }) {
  try {
    const response = await publicApi.post('/users/forgot-password/reset/', payload);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

export async function updateUserProfile(data: any) {
  const response = await apiClient.put('/users/profile/', data);
  return response.data;
}