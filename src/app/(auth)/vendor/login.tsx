import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { loginPassword } from '@/services/auth.service';
import { AppContainer } from '@/components/ui/AppContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { CustomPhoneInput } from '@/components/ui/CustomPhoneInput';
import { Ionicons } from '@expo/vector-icons';

export default function VendorLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { login } = useAuthStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<'initial' | 'email_login' | 'phone_login'>('initial');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await loginPassword({ email: email.trim(), password });
      const data = res.data;
      if (!data.access) throw new Error('No token received.');
      
      const role = data.user?.role || data.role;
      if (role !== 'vendor') {
        Alert.alert('Access Denied', 'This login is for Vendor accounts only.');
        return;
      }

      await login(
        data.user || { id: data.user_id, name: data.full_name, role, email: email.trim() },
        { access: data.access, refresh: data.refresh }
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Login failed.';
      Alert.alert('Login Failed', msg);
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
        <ScrollView 
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          centerContent
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
                onGooglePress={() => Alert.alert('Coming Soon', 'Google Login for vendors is being integrated.')}
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

                <Button 
                  title="Sign In to Dashboard" 
                  variant="primary"
                  isLoading={loading} 
                  onPress={handleLogin} 
                  style={{ marginTop: 8 }} 
                />

                <TouchableOpacity className="items-center mt-4" onPress={() => setStep("initial")}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600', textAlign: 'center' }}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'phone_login' && (
              <View style={styles.form}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 }}>Phone Number</Text>
                <CustomPhoneInput
                  value={email} // Using email state for phone temporarily if needed, but better to add phone state
                  onChangeText={setEmail}
                  onFormattedChange={() => {}}
                />
                
                <Button 
                  title="Send OTP" 
                  variant="primary"
                  isLoading={loading} 
                  onPress={() => Alert.alert('OTP Sent', 'This feature is coming soon to the Vendor portal.')} 
                  style={{ marginTop: 8 }} 
                />

                <TouchableOpacity className="items-center mt-4" onPress={() => setStep("initial")}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600', textAlign: 'center' }}>← Go Back</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 24, alignSelf: 'flex-start', padding: 4 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 36, lineHeight: 20 },
  form: { gap: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
