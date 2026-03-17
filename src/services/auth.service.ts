// auth.service.ts
import { api, publicApi, saveTokens } from './api-client';

export const registerUser = (data: any) => publicApi.post('users/register/', data);
export const requestOTP = (data: any) => publicApi.post('users/request-otp/', data);
export const loginOTP = async (data: any) => {
  const res = await publicApi.post('users/login-otp/', data);
  await saveTokens(res.data.access, res.data.refresh, res.data.user);
  return res;
};
export const loginPassword = async (data: any) => {
  const res = await publicApi.post('users/login-password/', data);
  await saveTokens(res.data.access, res.data.refresh, res.data.user);
  return res;
};
export const googleLogin = async (data: any) => {
  const res = await publicApi.post('users/google-login/', data);
  await saveTokens(res.data.access, res.data.refresh, res.data.user);
  return res;
};
export const forgotPassword = (data: any) => publicApi.post('users/forgot-password/', data);
export const verifyForgotOTP = (data: any) => publicApi.post('users/forgot-password/verify-otp/', data);
export const resetPassword = (data: any) => publicApi.post('users/forgot-password/reset/', data);
export const getProfile = () => api.get('users/profile/');
export const fetchProfile = getProfile; // Alias for store compatibility
export const updateProfile = (data: any) => api.patch('users/profile/', data);
export const deleteProfile = () => api.delete('users/profile/');
export const contactSupport = (data: any) => publicApi.post('users/contact/', data);
export const siteContent = () => publicApi.get('users/site-content/');