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

import { useLogin } from "@/hooks/auth/useLogin";
import { Input } from "@/components/ui/Input";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { AppContainer } from "@/components/ui/AppContainer";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/theme/colors";
import { Typography } from "@/constants/Typography";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
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
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../../assets/images/pandit-logo.png")}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.tagline}>Connecting Faith with Excellence</Text>
            </View>

            {step === "initial" && (
              <View style={styles.stepContainer}>
                <Button
                  title="Continue with Phone"
                  variant="primary"
                  leftIcon={<Ionicons name="call" size={20} color={Colors.light.surface} />}
                  onPress={() => setStep("phone_login")}
                />

                <Button
                  title="Continue with Email"
                  variant="secondary"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.light.primary} />}
                  onPress={() => setStep("email_login")}
                  style={{ marginTop: 12 }}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Button has specific branding colors outside of primary/secondary */}
                <TouchableOpacity 
                  style={[styles.googleBtn, loading && { opacity: 0.5 }]}
                  onPress={handleGooglePress}
                  disabled={loading}
                >
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                  <TouchableOpacity onPress={navToSignup}>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>

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
          </View>
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
