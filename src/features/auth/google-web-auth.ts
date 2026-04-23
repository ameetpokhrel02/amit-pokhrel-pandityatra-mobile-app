import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { googleLogin } from '@/services/auth.service';
import { API_BASE_URL } from '@/services/api-client';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthResolved = {
  access: string;
  refresh: string;
  user: any;
  requires_2fa?: boolean;
  requires_setup?: boolean;
  pre_auth_id?: string;
};

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const parseMaybeJson = (raw: unknown): any => {
  const str = asString(raw);
  if (!str) return null;

  try {
    return JSON.parse(str);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch {
      return null;
    }
  }
};

const getWebOrigin = () => API_BASE_URL.replace(/\/api\/?$/, '');

const buildGoogleStartUrl = (returnUrl: string) => {
  const origin = getWebOrigin();
  const configured = process.env.EXPO_PUBLIC_GOOGLE_WEB_AUTH_URL || `${origin}/accounts/google/login/`;

  const url = new URL(configured);

  // Keep the callback target backend-friendly. Do not forward app-style redirect_uri values
  // to Google, because that can trigger redirect_uri_mismatch.
  url.searchParams.set('next', returnUrl);

  return url.toString();
};

const exchangeIfNeeded = async (code: string, idToken: string): Promise<GoogleAuthResolved> => {
  if (idToken) {
    const res = await googleLogin({ id_token: idToken });
    return res.data;
  }

  if (code) {
    // Backward/forward compatibility: backend can choose to support code exchange at same endpoint.
    const res = await googleLogin({ code });
    return res.data;
  }

  throw new Error('No authorization payload returned from OAuth callback.');
};

export const signInWithGoogleWebBrowser = async (): Promise<GoogleAuthResolved> => {
  const returnUrl = Linking.createURL('auth/google-callback');
  const authUrl = buildGoogleStartUrl(returnUrl);

  const session = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

  if (session.type !== 'success' || !session.url) {
    throw new Error('Google sign-in was canceled or did not complete.');
  }

  const parsed = Linking.parse(session.url);
  const query = (parsed.queryParams || {}) as Record<string, unknown>;

  if (query.error || query.error_description) {
    const errorCode = asString(query.error);
    const description = asString(query.error_description);
    throw new Error(description || errorCode || 'Google authentication failed.');
  }

  const access = asString(query.access || query.access_token || query.token);
  const refresh = asString(query.refresh || query.refresh_token);
  const code = asString(query.code);
  const idToken = asString(query.id_token);

  const maybeUser = query.user || query.user_data;
  const parsedUser = parseMaybeJson(maybeUser);

  if (access && refresh) {
    return {
      access,
      refresh,
      user: parsedUser,
    };
  }

  return exchangeIfNeeded(code, idToken);
};
