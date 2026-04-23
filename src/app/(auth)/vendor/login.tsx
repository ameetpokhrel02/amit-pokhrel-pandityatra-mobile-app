import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { loginPassword, requestOTP } from '@/services/auth.service';
import { AppContainer } from '@/components/ui/AppContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { CustomPhoneInput } from '@/components/ui/CustomPhoneInput';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogleWebBrowser } from '@/features/auth/google-web-auth';

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
    try {
      setLoading(true);
      const res = await signInWithGoogleWebBrowser();
      const userData = res.user;
      
      if (userData.role !== 'vendor') {
        Toast.show({ type: 'error', text1: 'Access Denied', text2: 'This account is not registered as a Vendor.' });
        return;
      }

      if (!res.access || !res.refresh) {
        throw new Error('Google login did not return app tokens.');
      }

      const tokens = { access: res.access, refresh: res.refresh };
      await loginStore.login(userData, tokens);
      Toast.show({ type: 'success', text1: 'Google Sign-In successful', text2: 'Welcome back to your vendor dashboard.' });
      router.replace("/(vendor)" as any);
      
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Google Sign-In failed', text2: error?.message || 'Please try again.' });
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
