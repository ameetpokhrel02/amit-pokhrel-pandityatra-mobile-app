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
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { Ionicons } from "@expo/vector-icons";
import { requestOTP, googleLogin, getProfile, loginPassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const ANDROID_CLIENT_ID = EXTRA.androidClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthStep = "initial" | "email_login" | "phone_login";

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

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({}),
    []
  );

  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useIdTokenAuthRequest({
      clientId: GOOGLE_CLIENT_ID || undefined,
      androidClientId: ANDROID_CLIENT_ID || undefined,
      iosClientId: IOS_CLIENT_ID || undefined,
      webClientId: WEB_CLIENT_ID || undefined,
      redirectUri,
      scopes: ["profile", "email"],
    });

  useEffect(() => {
    const handleGoogle = async () => {
      if (googleResponse?.type !== "success") return;

      const idToken =
        (googleResponse.authentication as any)?.idToken ||
        (googleResponse.params as any)?.id_token;
      if (!idToken) {
        Alert.alert("Google Sign-In", "No id_token returned from Google.");
        return;
      }

      try {
        setLoading(true);
        const res = await googleLogin({ id_token: idToken }); 
        
        const userData = res.data.user;
        const tokens = { access: res.data.access, refresh: res.data.refresh };
        await loginStore.login(userData, tokens);

        if (userData.role === "pandit") router.replace("/(pandit)" as any);
        else router.replace("/(customer)" as any);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Google Sign-In failed", e?.message || "Please try again.");
      } finally {
        setLoading(false);
      }
    };

    handleGoogle();
  }, [googleResponse, router]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const finalPhone = formattedPhone || phone;
      if (!finalPhone) {
        Alert.alert("Error", "Please enter a valid phone number");
        return;
      }
      await requestOTP({ phone_number: finalPhone });
      router.push({ pathname: "/(auth)/user/otp", params: { phone: finalPhone, role: 'pandit' } });
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
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert("Config Error", "Missing Google client id.");
      return;
    }
    await googlePromptAsync();
  };

  const navToSignup = () => {
    router.push("/(auth)/pandit/register" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center', minHeight: SCREEN_HEIGHT }} 
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
            <Text className="text-base text-zinc-500 text-center font-medium mt-1">Welcome back, Pandit Ji</Text>
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
                  <Text className="text-primary font-bold text-[15px]">Register as Pandit</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                className="items-center mt-3" 
                onPress={() => router.back()}
              >
                <Text className="text-zinc-500 text-[15px] font-semibold">← Change Role</Text>
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
