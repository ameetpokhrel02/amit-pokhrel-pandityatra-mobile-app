import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { loginPassword } from '@/services/auth.service';
import { AppContainer } from '@/components/ui/AppContainer';
import { Button } from '@/components/ui/Button';

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
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top || 24, paddingBottom: insets.bottom + 32 }]}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary || colors.text} />
          </TouchableOpacity>

          {/* Logo / Icon */}
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="store" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary || colors.text }]}>Vendor Login</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary || colors.icon }]}>
            Sign in to manage your shop on PanditYatra
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary || colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={colors.textSecondary || colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary || colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary || colors.placeholder}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary || colors.icon} />
              </TouchableOpacity>
            </View>

            <Button 
              title="Sign In to Dashboard" 
              variant="primary"
              isLoading={loading} 
              onPress={handleLogin} 
              style={{ marginTop: 8 }} 
            />
          </View>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary || colors.text }]}>Don&apos;t have a vendor account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/vendor/register' as any)}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Register as Vendor</Text>
            </TouchableOpacity>
          </View>
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
