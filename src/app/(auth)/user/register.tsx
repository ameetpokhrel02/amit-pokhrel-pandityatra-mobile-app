import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { registerUser, googleLogin } from '@/services/auth.service';
import { useAuthStore } from "@/store/auth.store";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const ANDROID_CLIENT_ID = EXTRA.androidClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomerRegister() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Required', 'Please fill in all required fields (*)');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const finalPhone = formattedPhone || phone;
    
    try {
      setLoading(true);
      await registerUser({
        full_name: fullName,
        phone_number: finalPhone,
        email,
        password,
        role: 'user',
      });
      
      router.push({
        pathname: '/(auth)/user/otp',
        params: { phone: finalPhone, email, mode: 'register' }
      } as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Registration failed', e.response?.data?.detail || e.message || 'Please try again.');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, minHeight: SCREEN_HEIGHT }} 
        keyboardShouldPersistTaps="handled" 
        bounces={false}
      >
        <View className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/10 w-full max-w-[450px] self-center my-10">
          <View className="items-center mb-8">
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              className="w-[140px] h-[140px] mb-2"
              contentFit="contain"
            />
            <Text className="text-base text-zinc-500 text-center font-medium mt-1">Create a New Account</Text>
          </View>

          <View className="gap-4">
            <Input 
              label="Full Name *" 
              placeholder="Your full name" 
              value={fullName} 
              onChangeText={setFullName}
            />
            
            <View>
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Phone Number</Text>
              <CustomPhoneInput
                value={phone}
                onChangeText={setPhone}
                onFormattedChange={setFormattedPhone}
              />
            </View>

            <View>
              <Input 
                label="Email Address *" 
                placeholder="you@example.com" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
              />
            </View>
            
            <View>
              <Input 
                label="Password *" 
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

            <View>
              <Input 
                label="Confirm Password *" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                }
              />
            </View>

            <TouchableOpacity
              className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mt-6 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white text-lg font-bold">Sign Up</Text>}
            </TouchableOpacity>

            <View className="flex-row items-center my-5">
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
              <Text className="text-zinc-700 text-base font-semibold">Sign up with Google</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-zinc-500 text-[15px]">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/user/login' as any)}>
                <Text className="text-primary font-bold text-[15px]">Login</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="items-center mt-4" 
              onPress={() => router.back()}
            >
              <Text className="text-zinc-500 font-semibold">← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
