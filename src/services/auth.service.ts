// auth.service.ts
import { api, publicApi, saveTokens } from './api-client';

export const registerUser = (data: any) => publicApi.post('users/register/', data);
export const requestOTP = (data: any) => publicApi.post('users/request-otp/', data);
export const loginOTP = async (data: any) => {
  const res = await publicApi.post('users/login-otp/', data);
  if (res.data.requires_2fa || res.data.requires_setup) return res; // Step 1 of 2FA
  const userData = res.data.user || { id: res.data.user_id, name: res.data.full_name, role: res.data.role };
  await saveTokens(res.data.access, res.data.refresh, userData);
  return res;
};
export const loginPassword = async (data: any) => {
  const res = await publicApi.post('users/login-password/', data);
  if (res.data.requires_2fa || res.data.requires_setup) return res; // Step 1 of 2FA
  const userData = res.data.user || { id: res.data.user_id, name: res.data.full_name, role: res.data.role };
  await saveTokens(res.data.access, res.data.refresh, userData);
  return res;
};
export const googleLogin = async (data: any) => {
  const res = await publicApi.post('users/google-login/', data);
  if (res.data.requires_2fa || res.data.requires_setup) return res;
  await saveTokens(res.data.access, res.data.refresh, res.data.user);
  return res;
};
// -- 2FA ENDPOINTS --
export const verifyTOTP = async (token: string, pre_auth_id: string) => {
  const res = await publicApi.post('users/auth/2fa/verify/', { token, pre_auth_id });
  const userData = res.data.user || { id: res.data.user_id, name: res.data.full_name, role: res.data.role };
  await saveTokens(res.data.access, res.data.refresh, userData);
  return res;
};
export const getTOTPStatus = () => api.get('users/auth/2fa/status/');
export const setupTOTP = () => api.get('users/auth/2fa/setup/');
export const confirmTOTPSetup = (token: string) => api.post('users/auth/2fa/setup/', { token });
export const disableTOTP = (token: string) => api.delete('users/auth/2fa/setup/', { data: { token } });

export const forgotPassword = (data: any) => publicApi.post('users/forgot-password/', data);
export const requestPasswordResetOTP = forgotPassword; // Fixed casing
export const verifyForgotOTP = (data: any) => publicApi.post('users/forgot-password/verify-otp/', data);
export const verifyOTP = loginOTP; // Added for general OTP verification
export const resetPassword = (data: any) => publicApi.post('users/forgot-password/reset/', data);
export const resetPasswordWithToken = resetPassword; // Alias
export const getProfile = () => api.get('users/profile/');
export const fetchProfile = getProfile; // Alias for store compatibility
export const updateProfile = (data: any) => api.patch('users/profile/', data);
export const deleteProfile = () => api.delete('users/profile/');
export const contactSupport = (data: any) => publicApi.post('users/contact/', data);
export const contactUs = contactSupport; // Alias for UI consistency
export const siteContent = () => publicApi.get('users/site-content/');