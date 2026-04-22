import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { loginPassword, googleLogin, requestOTP } from '@/services/auth.service';
import { AppContainer } from '@/components/ui/AppContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { CustomPhoneInput } from '@/components/ui/CustomPhoneInput';
import { Ionicons } from '@expo/vector-icons';
import { isExpoGo } from "@/utils/expo-go";

// Conditionally import GoogleSignin
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
const WEB_CLIENT_ID = EXTRA.webClientId || EXTRA.expoPublicGoogleClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";

if (GoogleSignin) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID || undefined,
    iosClientId: IOS_CLIENT_ID || undefined,
  });
}

export default function VendorLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const loginStore = useAuthStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'email_login' | 'phone_login'>('initial');

  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter your email and password.' });
      return;
    }
    try {
      setLoading(true);
      const res = await loginPassword({ email: email.trim(), password });
      const data = res.data;
      
      const role = data.user?.role || data.role;
      if (role !== 'vendor') {
        Toast.show({ type: 'error', text1: 'Access Denied', text2: 'This login is for Vendor accounts only.' });
        return;
      }

      await loginStore.login(
        data.user || { id: data.user_id, name: data.full_name, role, email: email.trim() },
        { access: data.access, refresh: data.refresh }
      );

      // Redirect after successful login
      router.replace("/(vendor)" as any);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Login failed.';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (isExpoGo()) {
      Alert.alert("Expo Go Limited", "Google Sign-In is not available in Expo Go. Please use a native build.");
      return;
    }

    if (!GoogleSignin) {
      Alert.alert("Error", "Google Sign-In module is not available.");
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
      
      if (userData.role !== 'vendor') {
        Toast.show({ type: 'error', text1: 'Access Denied', text2: 'This account is not registered as a Vendor.' });
        return;
      }

      const tokens = { access: res.data.access, refresh: res.data.refresh };
      await loginStore.login(userData, tokens);
      router.replace("/(vendor)" as any);
      
    } catch (error: any) {
      console.error(error);
      if (error.code !== statusCodes?.SIGN_IN_CANCELLED) {
        Alert.alert("Google Sign-In failed", error.message || "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const finalPhone = formattedPhone || phone;
      if (!finalPhone) {
        Alert.alert("Error", "Please enter a valid phone number");
        return;
      }
      await requestOTP({ phone_number: finalPhone });
      router.push({ pathname: "/(auth)/user/otp", params: { phone: finalPhone, role: 'vendor' } });
    } catch (e: any) {
      console.error(e);
      Alert.alert("OTP Error", e?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer hideFab>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView 
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32, justifyContent: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <AuthCard
            role="vendor"
            mode="login"
            onToggleMode={() => router.push('/(auth)/vendor/register' as any)}
            onChangeRole={() => router.replace("/")}
          >
            {step === 'initial' && (
              <AuthButtons
                onPhonePress={() => setStep('phone_login')}
                onEmailPress={() => setStep('email_login')}
                onGooglePress={handleGooglePress}
              />
            )}

            {step === 'email_login' && (
              <View style={styles.form}>
                <Input
                  label="Email Address"
                  placeholder="vendor@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPwd}
                  value={password}
                  onChangeText={setPassword}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                      <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  }
                />
                
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4 }}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/user/forgot-password' as any)}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primary }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <Button 
                  title="Sign In to Dashboard" 
                  variant="primary"
                  isLoading={loading} 
                  onPress={handleLogin} 
                  style={{ marginTop: 8 }} 
                />

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => setStep("initial")}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'phone_login' && (
              <View style={styles.form}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 }}>Phone Number</Text>
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

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => setStep("initial")}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, minHeight: '100%' },
  form: { gap: 16 },
});
