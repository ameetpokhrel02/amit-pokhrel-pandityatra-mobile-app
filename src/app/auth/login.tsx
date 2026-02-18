import React, { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { requestOtp, googleSignIn, getMe } from "@/services/auth.service";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  (Constants.expoConfig?.extra as any)?.expoPublicGoogleClientId || "";

export default function LoginScreen() {
  const router = useRouter();
  const [authType, setAuthType] = useState<"otp" | "password">("otp");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_NOT_SET",
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["profile", "email"],
      redirectUri: AuthSession.makeRedirectUri(),
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    }
  );

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
          await googleSignIn(idToken);
          const user = await getMe();

          if (user.role === "pandit") {
            router.replace("/(pandit)" as any);
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
      if (authType === 'otp') {
        const identifier = method === 'email' ? email : phone;
        if (!identifier) {
          Alert.alert("Error", `Please enter your ${method}`);
          setLoading(false);
          return;
        }

        await requestOtp(
          method === 'email' ? email : '',
          method === 'phone' ? phone : ''
        );

        router.push({
          pathname: "/auth/otp",
          params: { email: method === 'email' ? email : undefined, phone: method === 'phone' ? phone : undefined },
        });
      } else {
        // Password Login
        const identifier = method === 'email' ? email : phone;
        if (!identifier || !password) {
          Alert.alert("Error", "Please enter both credentials");
          setLoading(false);
          return;
        }

        await require('@/services/auth.service').loginWithPassword(identifier, password);
        const user = await getMe();

        if (user.role === "pandit") {
          router.replace("/(pandit)" as any);
        } else if (user.role === "admin") {
          router.replace("/admin/dashboard" as any);
        } else {
          router.replace("/(customer)" as any);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Login Error", err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Enter your details to login</Text>

          {/* Auth Type Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, authType === 'otp' && styles.activeTab]}
              onPress={() => setAuthType('otp')}
            >
              <Text style={[styles.tabText, authType === 'otp' && styles.activeTabText]}>OTP Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, authType === 'password' && styles.activeTab]}
              onPress={() => setAuthType('password')}
            >
              <Text style={[styles.tabText, authType === 'password' && styles.activeTabText]}>Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.methodContainer}>
            <Button
              title="Phone"
              variant={method === "phone" ? "primary" : "outline"}
              onPress={() => setMethod("phone")}
              style={styles.methodButton}
            />
            <Button
              title="Email"
              variant={method === "email" ? "primary" : "outline"}
              onPress={() => setMethod("email")}
              style={styles.methodButton}
            />
          </View>

          {method === "phone" ? (
            <Input
              label="Phone Number"
              placeholder="98XXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color="#6B7280" />}
            />
          ) : (
            <Input
              label="Email Address"
              placeholder="anita@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
            />
          )}

          {authType === 'password' && (
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
          )}

          <View style={styles.forgotPasswordContainer}>
            <Text
              style={styles.forgotPasswordLink}
              onPress={() => router.push("/auth/forgot-password" as any)}
            >
              Forgot Password?
            </Text>
          </View>

          <Button
            title={loading ? "Logging in..." : (authType === 'otp' ? "Send OTP" : "Login")}
            onPress={handleLogin}
            isLoading={loading}
            disabled={loading}
            style={styles.submitButton}
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
              Register
            </Text>
          </View>
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
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.primary,
    textAlign: "center",
    marginBottom: 8,
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
    color: Colors.light.primary,
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
});