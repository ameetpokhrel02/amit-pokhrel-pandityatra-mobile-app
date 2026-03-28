import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { isExpoGo } from "@/utils/expo-go";

import { requestOTP, googleLogin, loginPassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

// Conditionally import GoogleSignin to prevent crashing in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  if (!isExpoGo()) {
    const GoogleAuth = require("@react-native-google-signin/google-signin");
    GoogleSignin = GoogleAuth.GoogleSignin;
    statusCodes = GoogleAuth.statusCodes;
  }
} catch (e) {
  console.warn("Google Sign-In native module not found.");
}

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

if (GoogleSignin) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID || undefined,
    iosClientId: IOS_CLIENT_ID || undefined,
  });
}

export type AuthStep = "initial" | "email_login" | "phone_login" | "email_signup";

export const useLogin = () => {
  const router = useRouter();
  const loginStore = useAuthStore();

  const [step, setStep] = useState<AuthStep>("initial");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const finalPhone = formattedPhone || phone;
      if (!finalPhone) {
        Alert.alert("Error", "Please enter a valid phone number");
        return;
      }
      await requestOTP({ phone_number: finalPhone });
      router.push({ pathname: "/(auth)/user/otp", params: { phone: finalPhone } });
    } catch (e: any) {
      console.error(e);
      Alert.alert("OTP Error", e?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    try {
      setLoading(true);
      if (!email || !password) {
        Alert.alert("Error", "Please enter email and password");
        return;
      }

      const res = await loginPassword({ email, password });
      
      const tokens = { access: res.data.access, refresh: res.data.refresh };
      const userData = res.data.user || { 
        id: res.data.user_id, 
        name: res.data.full_name, 
        role: res.data.role,
        email: email 
      };
      
      await loginStore.login(userData, tokens);

      if (userData.role === "pandit") {
        router.replace("/(pandit)" as any);
      } else {
        router.replace("/(customer)" as any);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Login failed", e?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!GOOGLE_CLIENT_ID && !WEB_CLIENT_ID) {
      Alert.alert("Config Error", "Missing Google client id.");
      return;
    }
    
    if (isExpoGo()) {
      Alert.alert(
        "Expo Go Limited", 
        "Google Sign-In is not available in Expo Go. Please use Email/Phone login or use a native development build."
      );
      setLoading(false);
      return;
    }

    if (!GoogleSignin) {
      Alert.alert("Error", "Google Sign-In module is not available.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) {
         Alert.alert("Google Sign-In", "No id_token returned from Google.");
         return;
      }

      const res = await googleLogin({ id_token: idToken }); 
        
      const userData = res.data.user;
      const tokens = { access: res.data.access, refresh: res.data.refresh };
      await loginStore.login(userData, tokens);

      if (userData.role === "pandit") router.replace("/(pandit)" as any);
      else router.replace("/(customer)" as any);
      
    } catch (error: any) {
      console.error(error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Play services are not available or are outdated.");
      } else {
        Alert.alert("Google Sign-In failed", error.message || "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navToSignup = () => {
    router.push("/(auth)/user/register" as any);
  };

  const exploreAsGuest = () => {
    loginStore.continueAsGuest();
    router.replace('/(customer)');
  };

  return {
    step,
    setStep,
    email,
    setEmail,
    phone,
    setPhone,
    setFormattedPhone,
    password,
    setPassword,
    loading,
    showPassword,
    setShowPassword,
    handleSendOtp,
    handlePasswordLogin,
    handleGooglePress,
    navToSignup,
    exploreAsGuest
  };
};
