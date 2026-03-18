import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
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
import { Colors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { requestOTP, googleLogin, getProfile, loginPassword } from "@/services/auth.service";

WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const ANDROID_CLIENT_ID = EXTRA.androidClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

const { width } = Dimensions.get('window');

type LoginMode = "otp" | "password";
type IdentifierMode = "phone" | "email";
type RoleMode = "customer" | "pandit";

export default function LoginScreen() {
  const router = useRouter();

  const [role] = useState<RoleMode>("pandit");
  const [loginMode, setLoginMode] = useState<LoginMode>("otp");
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"selectMethod" | "form">("selectMethod");
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

      await loginPassword({ email, password });

      const profileRes = await getProfile();
      const profile: any = profileRes?.data ?? profileRes;
      const roleValue = profile?.role ?? profile?.user?.role;

      if (roleValue === "pandit") router.replace("/(pandit)" as any);
      else router.replace("/(customer)" as any);
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
    if (!googleRequest) {
      Alert.alert("Wait", "Google request not ready. Try again.");
      return;
    }
    await googlePromptAsync();
  };

  const handleGuest = () => {
    router.replace("/(customer)" as any);
  };

  const navToSignup = () => {
    router.push("/(auth)/pandit/register" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButtonTop} onPress={() => step === "form" ? setStep("selectMethod") : router.back()}>
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

          <Text style={styles.title}>PanditYatra</Text>
          <Text style={styles.subtitle}>Welcome back, Pandit Ji</Text>

          {/* MODE SELECTION */}
          {step === "selectMethod" && (
            <View style={styles.stepContainer}>
              <Button
                title="Continue with Phone"
                onPress={() => {
                  setLoginMode("otp");
                  setIdentifierMode("phone");
                  setStep("form");
                }}
                style={styles.fullWidthBtn}
                leftIcon={<Ionicons name="call" size={20} color="#FFF" />}
              />

              <Button
                title="Continue with Email"
                variant="outline"
                onPress={() => {
                  setLoginMode("password");
                  setIdentifierMode("email");
                  setStep("form");
                }}
                style={styles.fullWidthBtn}
                leftIcon={<Ionicons name="mail" size={20} color="#FF6F00" />}
              />

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <Button
                title="Continue with Google"
                variant="outline"
                onPress={handleGooglePress}
                style={styles.googleBtnStyle}
                textStyle={{ color: '#374151' }}
                leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
                disabled={!googleRequest || loading}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navToSignup}>
                  <Text style={styles.linkText}>Sign up</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.guestLink} onPress={handleGuest}>
                <Text style={styles.guestText}>Explore as Guest →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: LOGIN FORM */}
          {step === "form" && (
            <View style={styles.stepContainer}>
              <Text style={styles.formTitle}>
                {role === "pandit" ? "Pandit " : "Customer "}
                {identifierMode === "phone" ? "Phone Login" : "Email Login"}
              </Text>

              {identifierMode === "phone" ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <CustomPhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    onFormattedChange={setFormattedPhone}
                  />
                </View>
              ) : (
                <>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
                  />
                  <Input
                    label="Password"
                    placeholder="Enter password"
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
                  {loginMode === "password" && (
                      <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/user/forgot-password' as any)}>
                          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>
                  )}
                </>
              )}

              <Button
                title={
                  loading
                    ? "Please wait..."
                    : loginMode === "otp"
                    ? "Send OTP"
                    : "Login"
                }
                onPress={loginMode === "otp" ? handleSendOtp : handlePasswordLogin}
                style={styles.submitBtn}
                disabled={loading}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navToSignup}>
                  <Text style={styles.linkText}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF6F00", // Saffron
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 32,
  },
  stepContainer: {
    width: '100%',
    gap: 16,
  },
  formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
  },
  fullWidthBtn: {
    width: "100%",
    height: 54,
    borderRadius: 12,
  },
  googleBtnStyle: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  submitBtn: {
    width: "60%",
    alignSelf: "center",
    height: 54,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
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
  guestLink: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
  },
  guestText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 15,
  },
  linkText: {
    color: "#FF6F00",
    fontWeight: "bold",
    fontSize: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 16,
  },
  forgotPasswordText: {
      color: '#6B7280',
      fontSize: 13,
      fontWeight: '500',
  }
});
