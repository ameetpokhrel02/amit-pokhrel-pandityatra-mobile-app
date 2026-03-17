import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { registerUser, googleLogin, getProfile } from '@/services/auth.service';
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

export default function CustomerRegister() {
  const router = useRouter();
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
        await googleLogin({ id_token: idToken }); 
        const profileRes = await getProfile(); 
        const profile: any = profileRes?.data ?? profileRes;
        const roleValue = profile?.role ?? profile?.user?.role;

        if (roleValue === "pandit") router.replace("/(pandit)" as any);
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
        pathname: '/auth/otp',
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
    if (!googleRequest) {
      Alert.alert("Wait", "Google request not ready. Try again.");
      return;
    }
    await googlePromptAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButtonTop} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/pandit-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PanditYatra as a Customer</Text>

          <View style={styles.formContainer}>
            <Input 
              label="Full Name *" 
              placeholder="Your full name" 
              value={fullName} 
              onChangeText={setFullName}
              leftIcon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />}
            />
            
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <CustomPhoneInput
                value={phone}
                onChangeText={setPhone}
                onFormattedChange={setFormattedPhone}
              />
            </View>

            <Input 
              label="Email Address *" 
              placeholder="you@example.com" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none" 
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
            />
            
            <Input 
              label="Password *" 
              placeholder="••••••••" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              }
            />

            <Input 
              label="Confirm Password *" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              }
            />

            <Button
              title={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            />

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <Button
              title="Sign up with Google"
              variant="outline"
              onPress={handleGooglePress}
              style={styles.googleBtnStyle}
              textStyle={{ color: '#374151' }}
              leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
              disabled={!googleRequest || loading}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButtonTop: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 10,
      padding: 8,
      backgroundColor: '#FFF',
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6F00", // Saffron
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  orText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: '500',
  },
  googleBtnStyle: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  linkText: {
    color: "#FF6F00",
    fontWeight: "bold",
    fontSize: 14,
  },
});
