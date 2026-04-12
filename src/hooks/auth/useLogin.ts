import { useState, useEffect } from "react";
import { Alert } from "react-native";
import Toast from 'react-native-toast-message';
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { requestOTP, googleLogin, loginPassword, verifyTOTP } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

export type AuthStep = "initial" | "email_login" | "phone_login" | "email_signup" | "totp_verify" | "totp_setup";

export const useLogin = () => {
  const router = useRouter();
  const loginStore = useAuthStore();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: EXTRA.androidClientId || WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID || WEB_CLIENT_ID,
  });

  const [step, setStep] = useState<AuthStep>("initial");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 2FA States
  const [otpCode, setOtpCode] = useState("");
  const [preAuthId, setPreAuthId] = useState("");
  const [qrCodeData, setQrCodeData] = useState<{ qr_code: string, secret: string } | null>(null);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        try {
          if (!response.params.id_token) throw new Error("No id_token received.");
          setLoading(true);
          const res = await googleLogin({ id_token: response.params.id_token }); 
          
          if (res.data?.requires_2fa) {
            setPreAuthId(res.data.pre_auth_id);
            setStep("totp_verify");
            setLoading(false);
            return;
          } else if (res.data?.requires_setup) {
            setPreAuthId(res.data.pre_auth_id);
            // Auto fetch setup QR (Optional based on backend approach)
            setStep("totp_setup");
            setLoading(false);
            return;
          }

          const userData = res.data.user;
          const tokens = { access: res.data.access, refresh: res.data.refresh };
          await loginStore.login(userData, tokens);

          if (userData.role === "pandit") router.replace("/(pandit)" as any);
          else router.replace("/(customer)" as any);
        } catch (e: any) {
          console.error(e);
          Toast.show({ type: 'error', text1: 'Google Login Failed', text2: e?.message || "Please try again." });
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        Toast.show({ type: 'error', text1: 'Google Login Canceled', text2: response.error?.message || "Something went wrong." });
      }
    };

    if (response) handleGoogleResponse();
  }, [response]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const finalPhone = formattedPhone || phone;
      if (!finalPhone) {
        Toast.show({
          type: 'error',
          text1: 'Phone Number Required',
          text2: 'Please enter a valid phone number',
        });
        return;
      }
      await requestOTP({ phone_number: finalPhone });
      router.push({ pathname: "/(auth)/user/otp", params: { phone: finalPhone } });
    } catch (e: any) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'OTP Error',
        text2: e?.message || "Failed to send OTP. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    try {
      setLoading(true);
      if (!email || !password) {
        Toast.show({
          type: 'error',
          text1: 'Required',
          text2: 'Please enter email and password',
        });
        return;
      }

      const res = await loginPassword({ email, password });
      
      if (res.data?.requires_2fa) {
        setPreAuthId(res.data.pre_auth_id);
        setStep("totp_verify");
        setLoading(false);
        return;
      } else if (res.data?.requires_setup) {
        setPreAuthId(res.data.pre_auth_id);
        setStep("totp_setup");
        setLoading(false);
        return;
      }
      
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
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: e?.message || "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!request) {
      Toast.show({
        type: 'info',
        text1: 'Not Ready',
        text2: 'Google login is still initializing...',
      });
      return;
    }
    
    try {
      await promptAsync();
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Could not start Google login.' });
    }
  };

  const handleTotpVerify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Please enter a 6-digit code.' });
      return;
    }
    try {
      setLoading(true);
      const res = await verifyTOTP(otpCode, preAuthId);
      
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
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: e?.message || 'Invalid authenticator code.' });
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
    exploreAsGuest,
    otpCode,
    setOtpCode,
    preAuthId,
    setPreAuthId,
    qrCodeData,
    setQrCodeData,
    handleTotpVerify
  };
};
