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
import Toast from 'react-native-toast-message';
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { useAuthStore } from "@/store/auth.store";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AppContainer } from "@/components/ui/AppContainer";
import { Colors } from "@/theme/colors";
import { requestOTP, loginPassword } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { signInWithGoogleWebBrowser } from "@/features/auth/google-web-auth";


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
        Toast.show({
          type: 'error',
          text1: 'Required',
          text2: 'Please enter email and password',
        });
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
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: e?.message || "Invalid credentials",
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      setLoading(true);
      const res = await signInWithGoogleWebBrowser();

      if (!res.access || !res.refresh) {
        throw new Error('Google login did not return app tokens.');
      }

      const userData = res.user;
      const tokens = { access: res.access, refresh: res.refresh };
      await loginStore.login(userData, tokens);

      Toast.show({
        type: 'success',
        text1: 'Google Sign-In successful',
        text2: 'Welcome back to your pandit dashboard.',
      });

      if (userData.role === "pandit") router.replace("/(pandit)" as any);
      else router.replace("/(customer)" as any);
      
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In failed',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const navToSignup = () => {
    router.push("/(auth)/pandit/register" as any);
  };

  return (
    <AppContainer hideFab>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }} 
          keyboardShouldPersistTaps="handled" 
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <AuthCard
            role="pandit"
            mode="login"
            onToggleMode={navToSignup}
            onChangeRole={() => router.replace("/")}
          >
            {step === "initial" && (
              <AuthButtons
                onPhonePress={() => setStep("phone_login")}
                onEmailPress={() => setStep("email_login")}
                onGooglePress={handleGooglePress}
              />
            )}

            {step === "email_login" && (
              <View style={{ gap: 16 }}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/user/forgot-password' as any)}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.light.primary }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                
                <Button
                  title="Login"
                  variant="primary"
                  isLoading={loading}
                  onPress={handlePasswordLogin}
                  style={{ marginTop: 8 }}
                />

                <TouchableOpacity 
                  style={{ alignItems: 'center', marginTop: 16 }} 
                  onPress={() => setStep("initial")}
                >
                  <Text style={{ color: '#666', fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "phone_login" && (
              <View style={{ gap: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Phone Number</Text>
                <CustomPhoneInput
                  value={phone}
                  onChangeText={setPhone}
                  onFormattedChange={setFormattedPhone}
                />
                <Button
                  title="Send OTP"
                  variant="primary"
                  isLoading={loading}
                  onPress={handleSendOtp}
                  style={{ marginTop: 8 }}
                />
                <TouchableOpacity 
                  style={{ alignItems: 'center', marginTop: 16 }} 
                  onPress={() => setStep("initial")}
                >
                  <Text style={{ color: '#666', fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
