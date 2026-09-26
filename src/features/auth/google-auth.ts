import { Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';

import { googleLogin } from '@/services/auth.service';

/**
 * Native Google Sign-In → backend `POST users/google-login/` (see API_MOBILE.md).
 *
 * The backend verifies that the Google ID token's audience is its own OAuth client, so we ask
 * Google for a token issued to the *web* client ID (the one the backend is configured with).
 * No Firebase is involved.
 */

export type GoogleSignupRole = 'user' | 'pandit' | 'vendor';

export type GoogleLoginResult = {
  access?: string;
  refresh?: string;
  role?: string;
  user?: any;
  requires_2fa?: boolean;
  requires_setup?: boolean;
  pre_auth_id?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || extra.webClientId;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId;

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in was cancelled.');
    this.name = 'GoogleSignInCancelled';
  }
}

/** Expo Go does not ship the Google Sign-In native module; only a development/release build does. */
export const isGoogleSignInAvailable = () => TurboModuleRegistry.get('RNGoogleSignin') != null;

let configured = false;

// Required lazily: importing the library at module load crashes in Expo Go, where the native module is missing.
const getLibrary = () => {
  if (!isGoogleSignInAvailable()) {
    throw new Error(
      'Google Sign-In needs a development build of the app (it does not work in Expo Go). ' +
        'Run `npx expo run:ios` / `npx expo run:android`, or use phone/email login.',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay lazy (see above)
  const lib = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  if (!configured) {
    if (!WEB_CLIENT_ID) throw new Error('Google Sign-In is not configured (missing web client ID).');
    // Without an iOS client the build has no Google URL scheme, and the native SDK would crash the app
    if (Platform.OS === 'ios' && !IOS_CLIENT_ID) {
      throw new Error('Google Sign-In is not configured for iOS yet (EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is missing).');
    }
    lib.GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      // iOS needs its own iOS-type OAuth client; Android only needs its client registered in Google Cloud.
      iosClientId: Platform.OS === 'ios' ? IOS_CLIENT_ID : undefined,
      scopes: ['profile', 'email'],
    });
    configured = true;
  }
  return lib;
};

/**
 * Sign in with Google and exchange the ID token for PanditYatra tokens.
 * @param role Role to create the account with if this Google account is new (ignored for existing accounts).
 */
export async function signInWithGoogle(role: GoogleSignupRole = 'user'): Promise<GoogleLoginResult> {
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = getLibrary();

  let idToken: string | null | undefined;
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    // Always show the account picker instead of silently reusing the last account
    await GoogleSignin.signOut().catch(() => {});

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) throw new GoogleSignInCancelled();
    idToken = response.data.idToken;
  } catch (error) {
    if (error instanceof GoogleSignInCancelled) throw error;
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new GoogleSignInCancelled();
        case statusCodes.IN_PROGRESS:
          throw new Error('Google sign-in is already in progress.');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services is not available or needs an update.');
        case 'DEVELOPER_ERROR':
        case '10':
          // Android: the app's package name + SHA-1 is not registered as an Android OAuth client
          throw new Error('Google Sign-In is misconfigured for this build (Android OAuth client / SHA-1 missing in Google Cloud).');
      }
    }
    throw error;
  }

  if (!idToken) {
    throw new Error('Google did not return an ID token. Check that the web client ID is correct.');
  }

  // googleLogin() stores the tokens; the mobile header makes the backend return `refresh` in the body.
  const res = await googleLogin({ id_token: idToken, role });
  return res;
}
