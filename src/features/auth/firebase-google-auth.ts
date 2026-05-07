import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { 
  GoogleAuthProvider, 
  signInWithCredential,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { googleLogin } from '@/services/auth.service';
import Constants from 'expo-constants';

// Configure Google Sign-In
const configureGoogleSignin = () => {
  const extra = Constants.expoConfig?.extra;
  GoogleSignin.configure({
    webClientId: extra?.webClientId || '993632978293-112fmct4s5ka6hctm8nk9hh8r7kuc9l1.apps.googleusercontent.com',
    iosClientId: extra?.iosClientId,
    offlineAccess: true,
  });
};

export const signInWithFirebaseGoogle = async () => {
  try {
    configureGoogleSignin();
    
    // 1. Trigger Google Sign-In
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    
    if (!data?.idToken) {
      throw new Error('Google Sign-In failed: No ID token returned');
    }

    // 2. Authenticate with Firebase using Google Credential
    const credential = GoogleAuthProvider.credential(data.idToken);
    const userCredential: UserCredential = await signInWithCredential(auth, credential);
    
    // 3. Get Firebase ID Token
    const firebaseIdToken = await userCredential.user.getIdToken();

    // 4. Send Firebase ID Token to backend
    // Note: The backend should be configured to verify Firebase ID tokens
    const res = await googleLogin({ 
      id_token: firebaseIdToken,
      provider: 'firebase' // Inform backend we are using firebase
    });

    return res.data;
  } catch (error: any) {
    console.error('Firebase Google Auth Error:', error);
    throw error;
  }
};
