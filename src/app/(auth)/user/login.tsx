import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/theme/colors";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { Input } from "@/components/ui/Input";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/hooks/auth/useLogin";
import { AppContainer } from "@/components/ui/AppContainer";
import { Typography } from "@/constants/Typography";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const {
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
    handleTotpVerify
  } = useLogin();

  return (
    <AppContainer hideFab>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled" 
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <AuthCard
            role="customer"
            mode="login"
            onToggleMode={navToSignup}
            onChangeRole={() => router.replace("/")}
          >
            {step === "initial" && (
              <View style={styles.stepContainer}>
                <AuthButtons
                  onPhonePress={() => setStep("phone_login")}
                  onEmailPress={() => setStep("email_login")}
                  onGooglePress={handleGooglePress}
                />

                <TouchableOpacity 
                  style={styles.guestBtn} 
                  onPress={exploreAsGuest}
                >
                  <Text style={styles.guestText}>Explore as Guest →</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "email_login" && (
              <View style={styles.stepContainer}>
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={{ marginTop: 16 }}>
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.icon} />
                      </TouchableOpacity>
                    }
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/user/forgot-password' as any)}>
                    <Text style={{ ...Typography.captionMedium, color: Colors.light.primary }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                
                <Button
                  title="Login"
                  variant="primary"
                  isLoading={loading}
                  onPress={handlePasswordLogin}
                  style={{ marginTop: 24 }}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => setStep("initial")}>
                  <Text style={styles.backText}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "phone_login" && (
              <View style={styles.stepContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
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
                  style={{ marginTop: 24 }}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => setStep("initial")}>
                  <Text style={styles.backText}>← Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "totp_verify" && (
              <View style={styles.stepContainer}>
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Ionicons name="shield-checkmark" size={64} color={Colors.light.primary} />
                  <Text style={{ ...Typography.h3, marginTop: 16 }}>Two-Factor Auth</Text>
                  <Text style={{ ...Typography.bodyMedium, color: Colors.light.textSecondary, textAlign: "center", marginTop: 8 }}>
                    Please enter the 6-digit verification code from your Authenticator app.
                  </Text>
                </View>
                
                <Input
                  label="Authenticator Code"
                  placeholder="123456"
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{ textAlign: "center", fontSize: 24, paddingVertical: 12, letterSpacing: 8 }}
                />

                <Button
                  title="Verify Identity"
                  variant="primary"
                  isLoading={loading}
                  onPress={handleTotpVerify}
                  style={{ marginTop: 24 }}
                  disabled={otpCode.length !== 6}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => setStep("email_login")}>
                  <Text style={styles.backText}>← Cancel</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: SCREEN_HEIGHT * 0.8,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    // Android shadow
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  stepContainer: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    ...Typography.captionMedium,
    color: Colors.light.textSecondary,
    paddingHorizontal: 16,
  },
  googleBtn: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
  },
  googleText: {
    ...Typography.bodyMedium,
    color: Colors.light.textPrimary,
    marginLeft: 12,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  signupLink: {
    ...Typography.bodyMedium,
    color: Colors.light.primary,
  },
  guestBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  guestText: {
    ...Typography.bodyMedium,
    color: Colors.light.textSecondary,
  },
  inputLabel: {
    ...Typography.inputLabel,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.light.textSecondary,
  },
});
