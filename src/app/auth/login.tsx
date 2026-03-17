import React, { useEffect, useState } from "react";
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import GoogleSignIn from "@/components/ui/GoogleSignIn";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { requestOTP, googleLogin, getProfile, loginPassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { API_BASE_URL } from "@/services/api-client";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  (Constants.expoConfig?.extra as any)?.expoPublicGoogleClientId || "";

const ANDROID_CLIENT_ID =
  (Constants.expoConfig?.extra as any)?.androidClientId || "";

export default function LoginScreen() {
  const router = useRouter();
  const [loginView, setLoginView] = useState<"selection" | "main" | "phone" | "email">("selection");
  const [intendedRole, setIntendedRole] = useState<"customer" | "pandit" | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: storeLogin, logout: storeLogout } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: (Constants.expoConfig?.extra as any)?.expoPublicGoogleClientId,
    androidClientId: (Constants.expoConfig?.extra as any)?.androidClientId,
    iosClientId: (Constants.expoConfig?.extra as any)?.iosClientId,
    webClientId: (Constants.expoConfig?.extra as any)?.webClientId,
    responseType: AuthSession.ResponseType.IdToken,
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleResponse(response);
    }
  }, [response]);

  const handleGoogleResponse = async (res: any) => {
    const idToken = res.params.id_token;
    if (!idToken) return;

    try {
      setLoading(true);
      const googleRes = await googleLogin(idToken);
      const { access, refresh } = googleRes.data;
      const profileRes = await getProfile();
      const user = profileRes.data;

      const userProfile = {
        id: user.id.toString(),
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        profile_pic_url: user.profile_pic_url
      };

      await storeLogin(userProfile, { access, refresh });
      navigateByRole(user);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (user: any) => {
    if (user.role === "pandit") {
      const isProfileComplete = user.is_pandit_profile_complete || user.pandit_profile;
      router.replace((isProfileComplete ? "/(pandit)" : "/auth/pandit-profile-setup") as any);
    } else if (user.role === "admin") {
      router.replace("/admin/dashboard" as any);
    } else {
      router.replace("/(customer)" as any);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (loginView === 'phone') {
        if (!phone || phone.length < 10) {
          Alert.alert("Invalid Phone", "Please enter a valid phone number.");
          return;
        }
        await requestOTP({ phone_number: formattedPhone });
        router.push({ pathname: "/auth/otp", params: { phone: formattedPhone } });
      } else if (loginView === 'email') {
        if (!email || !password) {
          Alert.alert("Error", "Please enter both credentials");
          return;
        }
        const loginRes = await loginPassword({ email, password });
        const { access, refresh } = loginRes.data;
        const profileRes = await getProfile();
        const user = profileRes.data;

        const userProfile = {
          id: user.id.toString(),
          name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          role: user.role,
        };

        await storeLogin(userProfile, { access, refresh });
        navigateByRole(user);
      }
    } catch (err: any) {
      Alert.alert("Login Error", err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    await storeLogout();
    router.replace("/(customer)");
  };

  const selectRole = (role: "customer" | "pandit") => {
    setIntendedRole(role);
    setLoginView("main");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/pandit-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {loginView === 'selection' && (
            <>
              <Text style={styles.title}>PanditYatra</Text>
              <Text style={styles.subtitle}>Connecting Faith with Excellence</Text>

              <Button
                title="Join as User"
                variant="primary"
                onPress={() => selectRole('customer')}
                style={styles.mainButton}
                leftIcon={<Ionicons name="person-outline" size={20} color="#FFF" />}
              />

              <Button
                title="Join as Pandit"
                variant="outline"
                onPress={() => selectRole('pandit')}
                style={styles.emailButton}
                leftIcon={<Ionicons name="school-outline" size={20} color="#FF6F00" />}
              />

              <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
                <Text style={styles.guestButtonText}>Explore as Guest <Ionicons name="arrow-forward" size={14} /></Text>
              </TouchableOpacity>
            </>
          )}

          {loginView === 'main' && (
            <>
              <Text style={styles.titleSmall}>{intendedRole === 'pandit' ? 'Pandit Login' : 'User Login'}</Text>
              <Text style={styles.subtitleSmall}>Choose your preferred login method</Text>

              <Button
                title="Continue with Phone"
                variant="primary"
                onPress={() => setLoginView('phone')}
                style={styles.mainButton}
                leftIcon={<Ionicons name="call-outline" size={20} color="#FFF" />}
              />

              <Button
                title="Continue with Email"
                variant="outline"
                onPress={() => setLoginView('email')}
                style={styles.emailButton}
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
                onPress={() => promptAsync()}
                style={styles.googleButton}
                textStyle={{ color: '#FF6F00' }}
                leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
                disabled={!request}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() => router.push(intendedRole === 'pandit' ? "/auth/pandit-register" : "/auth/customer-register")}
                >
                  Sign up
                </Text>
              </View>

              <TouchableOpacity style={styles.backLinkContainer} onPress={() => setLoginView('selection')}>
                <Text style={styles.backLink}>Change Role</Text>
              </TouchableOpacity>
            </>
          )}

          {loginView === 'phone' && (
            <View style={{ width: '100%' }}>
              <Text style={styles.titleSmall}>Phone Login</Text>
              <Text style={styles.subtitleSmall}>Enter your number to receive an OTP.</Text>

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
                variant="primary"
                onPress={handleLogin}
                isLoading={loading}
                disabled={loading || phone.length < 10}
                style={styles.submitButton}
              />

              <TouchableOpacity style={styles.backLinkContainer} onPress={() => setLoginView('main')}>
                <Text style={styles.backLink}>Other Options</Text>
              </TouchableOpacity>
            </View>
          )}

          {loginView === 'email' && (
            <View style={{ width: '100%' }}>
              <Text style={styles.titleSmall}>Email Login</Text>
              <Text style={styles.subtitleSmall}>Enter your credentials to continue.</Text>

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
                  onPress={() => router.push("/auth/forgot-password")}
                >
                  Forgot Password?
                </Text>
              </View>

              <Button
                title={loading ? "Logging in..." : "Login"}
                variant="primary"
                onPress={handleLogin}
                isLoading={loading}
                disabled={loading || !email || !password}
                style={styles.submitButton}
              />

              <TouchableOpacity style={styles.backLinkContainer} onPress={() => setLoginView('main')}>
                <Text style={styles.backLink}>Other Options</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF', // Pure white background to match card
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: '#F5F5F5', // Screen background is slight grey
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: '#FF6F00',
    textAlign: "center",
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
  },
  titleSmall: {
    fontSize: 28,
    fontWeight: "bold",
    color: '#FF6F00',
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: "center",
    marginBottom: 35,
    fontWeight: '400',
  },
  subtitleSmall: {
    fontSize: 16,
    color: '#666666',
    textAlign: "center",
    marginBottom: 20,
  },
  mainButton: {
    marginBottom: 16,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FF6F00',
  },
  emailButton: {
    marginBottom: 16,
    height: 58,
    borderRadius: 14,
    borderColor: '#FF6F00',
    borderWidth: 1.5,
  },
  googleButton: {
    marginBottom: 24,
    height: 58,
    borderRadius: 14,
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
  },
  phoneInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  orText: {
    marginHorizontal: 12,
    color: "#999999",
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  footerText: {
    color: "#666666",
    fontSize: 15,
  },
  link: {
    color: '#FF6F00',
    fontWeight: "bold",
    fontSize: 15,
  },
  guestButton: {
    marginTop: 35,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: 4,
  },
  forgotPasswordLink: {
    color: '#FF6F00',
    fontWeight: "600",
    fontSize: 14,
  },
  submitButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FF6F00',
  },
  backLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLink: {
    color: '#999999',
    fontSize: 15,
    fontWeight: '500',
  },
});
