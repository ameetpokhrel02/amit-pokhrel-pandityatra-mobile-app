import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { isExpoGo } from "@/utils/expo-go";

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

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { Ionicons } from "@expo/vector-icons";
import { requestOTP, googleLogin, getProfile, loginPassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

// WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const ANDROID_CLIENT_ID = EXTRA.androidClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

if (GoogleSignin) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID || undefined,
    // We use the iOS client ID here (or from GoogleService-Info.plist if provided)
    iosClientId: IOS_CLIENT_ID || undefined,
    // We don't necessarily need androidClientId here unless we are doing something specific, as it's typically picked up from google-services.json
  });
}


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthStep = "initial" | "email_login" | "phone_login" | "email_signup";

export default function LoginScreen() {
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
      
      // Fix for store update & redirect bug
      const tokens = { access: res.data.access, refresh: res.data.refresh };
      const userData = res.data.user || { 
        id: res.data.user_id, 
        name: res.data.full_name, 
        role: res.data.role,
        email: email 
      };
      
      console.log('[Login] Success. Updating store with role:', userData.role);
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
        "Google Sign-In is not available in Expo Go. Please use Email/Phone login or use a native development build (npx expo run:android)."
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
        
      // Fix for store update
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
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        Alert.alert("Error", "Play services are not available or are outdated.");
      } else {
        // some other error happened
        Alert.alert("Google Sign-In failed", error.message || "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navToSignup = () => {
    router.push("/(auth)/user/register" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: SCREEN_HEIGHT }} 
        keyboardShouldPersistTaps="handled" 
        bounces={false}
      >
        <View className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/10 w-full max-w-[450px] self-center">
          <View className="items-center mb-8">
            <Image
              source={require("../../../../assets/images/pandit-logo.png")}
              className="w-[140px] h-[140px] mb-2"
              contentFit="contain"
            />
            <Text className="text-base text-zinc-500 text-center font-medium mt-1">Connecting Faith with Excellence</Text>
          </View>

          {step === "initial" && (
            <View className="gap-4">
              <TouchableOpacity
                className="w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-primary/30 active:opacity-80"
                onPress={() => setStep("phone_login")}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold">Continue with Phone</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="w-full h-14 border-2 border-primary rounded-2xl flex-row items-center justify-center gap-3 active:bg-primary/5" 
                onPress={() => setStep("email_login")}
              >
                <Ionicons name="mail-outline" size={20} color="#FF6F00" />
                <Text className="text-primary text-lg font-bold">Continue with Email</Text>
              </TouchableOpacity>

              <View className="flex-row items-center my-3">
                <View className="flex-1 h-[1px] bg-zinc-200" />
                <Text className="px-4 text-sm text-zinc-400 font-semibold">OR</Text>
                <View className="flex-1 h-[1px] bg-zinc-200" />
              </View>

              <TouchableOpacity 
                className={`w-full h-14 border border-zinc-200 rounded-2xl flex-row items-center justify-center gap-3 active:bg-zinc-50 ${loading ? 'opacity-50' : ''}`}
                onPress={handleGooglePress}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text className="text-zinc-700 text-base font-semibold">Continue with Google</Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-2">
                <Text className="text-zinc-500 text-[15px]">Don't have an account? </Text>
                <TouchableOpacity onPress={navToSignup}>
                  <Text className="text-primary font-bold text-[15px]">Sign up</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                className="items-center mt-3" 
                onPress={() => {
                   loginStore.continueAsGuest();
                   router.replace('/(customer)');
                }}
              >
                <Text className="text-zinc-500 text-[15px] font-semibold">Explore as Guest →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "email_login" && (
            <View className="gap-4">
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View>
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  }
                />
              </View>
              
              <TouchableOpacity
                className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mt-2 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
                onPress={handlePasswordLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white text-lg font-bold">Login</Text>}
              </TouchableOpacity>

              <TouchableOpacity className="items-center mt-4" onPress={() => setStep("initial")}>
                <Text className="text-zinc-500 font-semibold">← Go Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "phone_login" && (
            <View className="gap-4">
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Phone Number</Text>
              <CustomPhoneInput
                value={phone}
                onChangeText={setPhone}
                onFormattedChange={setFormattedPhone}
              />
              <TouchableOpacity
                className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mt-2 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white text-lg font-bold">Send OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity className="items-center mt-4" onPress={() => setStep("initial")}>
                <Text className="text-zinc-500 font-semibold">← Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

