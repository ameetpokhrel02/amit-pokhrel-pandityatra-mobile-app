import React, { useEffect, useState } from "react";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { requestLoginOtp, googleLogin, fetchProfile, passwordLogin } from "@/services/auth.service";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  (Constants.expoConfig?.extra as any)?.expoPublicGoogleClientId || "";

const ANDROID_CLIENT_ID =
  (Constants.expoConfig?.extra as any)?.androidClientId || "";

export default function LoginScreen() {
  const router = useRouter();
  const [loginView, setLoginView] = useState<"main" | "phone" | "email">("main");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID, // Using the provided Web ID as a fallback or if it's dual-purpose
    iosClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    responseType: AuthSession.ResponseType.IdToken,
  });

  useEffect(() => {
    if (request) {
      console.log("[Google Auth] Request URL:", request.url);
      console.log("[Google Auth] Redirect URI:", request.redirectUri);
      console.log("[Google Auth] Client ID used:", request.clientId);
    }
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log("[Google Auth] Response received:", response.type);
      if (response.type === "error") {
        console.error("[Google Auth] Error details:", response.error);
      }
    }
  }, [response]);

  useEffect(() => {
    // DEBUG: Check what URL we are hitting
    import('@/services/api-client').then(module => {
      console.log("Current API Base URL:", module.API_BASE_URL);
      // Alert.alert("Debug Info", `API URL: ${module.API_BASE_URL}`); // Uncomment if you want to see it on screen
    });
  }, []);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        const idToken = (response.params as any).id_token as string | undefined;
        if (!idToken) {
          Alert.alert("Google Sign-In", "No id_token returned from Google.");
          return;
        }

        try {
          await googleLogin(idToken);
          const user = await fetchProfile();

          // Update local state
          await AsyncStorage.setItem('user', JSON.stringify({
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            role: user.role,
            photoUri: user.profile_pic_url
          }));

          if (user.role === "pandit") {
            const isProfileComplete = user.is_pandit_profile_complete || user.pandit_profile || user.expertise || user.experience_years;
            if (isProfileComplete) {
              router.replace("/(pandit)" as any);
            } else {
              router.replace("/auth/pandit-profile-setup" as any);
            }
          } else if (user.role === "admin") {
            router.replace("/admin/dashboard" as any);
          } else {
            router.replace("/(customer)" as any);
          }
        } catch (err: any) {
          console.error(err);
          Alert.alert(
            "Google Sign-In failed",
            err?.message || "Unable to login with Google. Please try again."
          );
        }
      }
    };

    handleGoogleResponse();
  }, [response, router]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (loginView === 'phone') {
        if (!phone || phone.length < 10) {
          Alert.alert("Invalid Phone", "Please enter a valid phone number.");
          setLoading(false);
          return;
        }

        await requestLoginOtp({
          phone_number: formattedPhone
        });

        router.push({
          pathname: "/auth/otp",
          params: { phone: formattedPhone },
        });
      } else if (loginView === 'email') {
        if (!email || !password) {
          Alert.alert("Error", "Please enter both credentials");
          setLoading(false);
          return;
        }

        await passwordLogin({ email, password });
        const user = await fetchProfile();

        // Update local state
        await AsyncStorage.setItem('user', JSON.stringify({
          name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          role: user.role,
          photoUri: user.profile_pic_url
        }));

        if (user.role === "pandit") {
          const isProfileComplete = user.is_pandit_profile_complete || user.pandit_profile || user.expertise || user.experience_years;
          if (isProfileComplete) {
            router.replace("/(pandit)" as any);
          } else {
            router.replace("/auth/pandit-profile-setup" as any);
          }
        } else if (user.role === "admin") {
          router.replace("/admin/dashboard" as any);
        } else {
          router.replace("/(customer)" as any);
        }
      }
    } catch (err: any) {
      const { API_BASE_URL } = require('@/services/api-client');
      console.error("Login error:", err);
      Alert.alert(
        "Login Error", 
        `${err.message || "Authentication failed"}\n\nTarget: ${API_BASE_URL}\n\nCheck if your backend is running on this IP and port 8000.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'role']);
    router.replace("/(customer)" as any);
  };

  const handleGoogleLoginPress = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "GOOGLE_CLIENT_ID_NOT_SET") {
      Alert.alert(
        "Google Sign-In not configured",
        "Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your app config to enable Google login."
      );
      return;
    }

    if (!request) {
      Alert.alert("Google Sign-In", "Google auth request is not ready yet. Please try again.");
      return;
    }

    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/pandit-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {loginView === 'main' && (
            <>
              <Text style={styles.title}>PanditYatra</Text>
              <Text style={styles.subtitle}>Connecting Faith with Excellence</Text>

              <Button
                title="Continue with Phone"
                onPress={() => setLoginView('phone')}
                style={styles.mainButton}
                leftIcon={<Ionicons name="call-outline" size={20} color="#FFF" />}
              />

              <Button
                title="Continue with Email"
                variant="outline"
                onPress={() => setLoginView('email')}
                style={styles.mainButton}
                leftIcon={<Ionicons name="mail-outline" size={20} color="#FF6F00" />}
              />

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <Button
                title="Continue with Google"
                variant="outline"
                onPress={handleGoogleLoginPress}
                style={styles.googleButton}
                leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() => router.push("/auth/customer-register" as any)}
                >
                  Sign up
                </Text>
              </View>

              <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
                <Text style={styles.guestButtonText}>Explore as Guest <Ionicons name="arrow-forward" size={14} /></Text>
              </TouchableOpacity>
            </>
          )}

          {loginView === 'phone' && (
            <>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>We will send you an OTP to verify.</Text>

              <View style={styles.phoneInputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <CustomPhoneInput
                  value={phone}
                  onChangeText={setPhone}
                  onFormattedChange={setFormattedPhone}
                />
              </View>

              <Button
                title={loading ? "Sending..." : "Send OTP"}
                onPress={handleLogin}
                isLoading={loading}
                disabled={loading || phone.length < 10}
                style={styles.submitButton}
              />

              <TouchableOpacity style={styles.backLinkContainer} onPress={() => setLoginView('main')}>
                <Text style={styles.backLink}>Back to Options</Text>
              </TouchableOpacity>
            </>
          )}

          {loginView === 'email' && (
            <>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>Enter your credentials to continue.</Text>

              <Input
                label="Email Address"
                placeholder="anita@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ marginTop: 12 }}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                }
              />

              <View style={styles.forgotPasswordContainer}>
                <Text
                  style={styles.forgotPasswordLink}
                  onPress={() => router.push("/auth/forgot-password" as any)}
                >
                  Forgot Password?
                </Text>
              </View>

              <Button
                title={loading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                isLoading={loading}
                disabled={loading || !email || !password}
                style={styles.submitButton}
              />

              <TouchableOpacity style={styles.backLinkContainer} onPress={() => setLoginView('main')}>
                <Text style={styles.backLink}>Back to Options</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: '#FF6F00',
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6F00',
  },
  methodContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordLink: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5EA",
  },
  orText: {
    marginHorizontal: 8,
    color: "#9E9E9E",
    fontSize: 12,
    fontWeight: "500",
  },
  googleButton: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#757575",
  },
  link: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  phoneInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  phoneContainer: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    height: 56,
  },
  phoneTextContainer: {
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontSize: 16,
    color: '#1F2937',
    height: 56,
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  phoneFlagButton: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  mainButton: {
    marginBottom: 12,
  },
  guestButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  backLinkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLink: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});