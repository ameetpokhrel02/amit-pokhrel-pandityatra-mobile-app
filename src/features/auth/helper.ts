// Auth API Helper Functions
import { API_BASE_URL } from "@/services/api-client";

export interface ForgotPasswordRequest {
  phone_number?: string;
  email?: string;
}

export interface ForgotPasswordOTPVerify {
  phone_number?: string;
  email?: string;
  otp_code: string;
}

export interface ResetPasswordRequest {
  phone_number?: string;
  email?: string;
  otp_code: string;
  new_password: string;
}

/**
 * Request OTP for forgot password
 */
export async function requestForgotPasswordOTP(payload: ForgotPasswordRequest) {
  const url = `${API_BASE_URL}/users/forgot-password/`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json();
}

/**
 * Verify OTP for forgot password
 */
export async function verifyForgotPasswordOTP(payload: ForgotPasswordOTPVerify) {
  const url = `${API_BASE_URL}/users/forgot-password/verify-otp/`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `OTP verification failed: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json();
}

/**
 * Reset password after OTP verification
 */
export async function resetPassword(payload: ResetPasswordRequest) {
  const url = `${API_BASE_URL}/users/forgot-password/reset/`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Password reset failed: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json();
}

