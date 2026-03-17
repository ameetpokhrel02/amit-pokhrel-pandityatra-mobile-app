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

WebBrowser.maybeCompleteAuthSession();

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const GOOGLE_CLIENT_ID = EXTRA.expoPublicGoogleClientId || "";
const ANDROID_CLIENT_ID = EXTRA.androidClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";
const WEB_CLIENT_ID = EXTRA.webClientId || GOOGLE_CLIENT_ID || "";

type LoginMode = "otp" | "password";
type IdentifierMode = "phone" | "email";
type RoleMode = "customer" | "pandit";

export default function LoginScreen() {
  const router = useRouter();

  const [role, setRole] = useState<RoleMode>("customer");
  const [loginMode, setLoginMode] = useState<LoginMode>("otp");
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"selectRole" | "selectMethod" | "form">("selectRole");

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        // Expo SDK 54 / expo-auth-session v7 types no longer expose useProxy here.
      }),
    []
  );

  // Fixes Expo Go + Google 400 invalid_request by using provider helper
  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useIdTokenAuthRequest(
      {
        // expo-auth-session v7 uses `clientId` (Expo / default),
        // plus platform-specific client IDs.
        clientId: GOOGLE_CLIENT_ID || undefined,
        androidClientId: ANDROID_CLIENT_ID || undefined,
        iosClientId: IOS_CLIENT_ID || undefined,
        webClientId: WEB_CLIENT_ID || undefined,
        redirectUri,
        scopes: ["profile", "email"],
      }
    );

  useEffect(() => {
    // Copy this exact URI into Google Cloud Console -> OAuth client -> Authorized redirect URIs
    console.log("[GoogleAuth] redirectUri:", redirectUri);
  }, [redirectUri]);

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
        await googleLogin({ id_token: idToken }); // POST /users/google-login/ + store tokens
        const profileRes = await getProfile(); // GET /users/profile/
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
      if (identifierMode === "phone") {
        if (!phone) {
          Alert.alert("Error", "Please enter phone number");
          return;
        }
        await requestOTP({ phone_number: phone });
        router.push({ pathname: "/auth/otp", params: { phone } });
      } else {
        if (!email) {
          Alert.alert("Error", "Please enter email");
          return;
        }
        await requestOTP({ email });
        router.push({ pathname: "/auth/otp", params: { email } });
      }
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
      if (!password) {
        Alert.alert("Error", "Please enter password");
        return;
      }
      const identifier = identifierMode === "phone" ? phone : email;
      if (!identifier) {
        Alert.alert("Error", `Please enter ${identifierMode}`);
        return;
      }

      const res = await loginPassword(
        identifierMode === "phone"
          ? { phone_number: identifier, password }
          : { email: identifier, password }
      );

      // Tokens are stored by auth.service -> saveTokens().
      void res;

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
      Alert.alert(
        "Google Sign-In not configured",
        "Missing Google client id in app config."
      );
      return;
    }
    if (Platform.OS === "android" && !ANDROID_CLIENT_ID) {
      Alert.alert(
        "Google Sign-In not configured",
        "Missing androidClientId in app.json extra."
      );
      return;
    }
    if (!googleRequest) {
      Alert.alert("Google Sign-In", "Google request not ready. Try again.");
      return;
    }
    await googlePromptAsync();
  };

  const handleGuest = () => {
    // Guest mode: roadmap allows browsing without login.
    // Guest is treated as customer experience.
    router.replace("/(customer)" as any);
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

          <Text style={styles.title}>PanditYatra</Text>
          <Text style={styles.subtitle}>Connecting Faith with Excellence</Text>

          {step === "selectRole" && (
            <>
              <View style={styles.roleRow}>
                <Button
                  title="Continue as Customer"
                  variant={role === "customer" ? "primary" : "outline"}
                  onPress={() => setRole("customer")}
                  style={styles.roleBtn}
                  leftIcon={<Ionicons name="person-outline" size={20} color={role === "customer" ? "#FFF" : Colors.light.primary} />}
                />
                <Button
                  title="Continue as Pandit"
                  variant={role === "pandit" ? "primary" : "outline"}
                  onPress={() => setRole("pandit")}
                  style={styles.roleBtn}
                  leftIcon={<Ionicons name="school-outline" size={20} color={role === "pandit" ? "#FFF" : Colors.light.primary} />}
                />
              </View>

              <Button
                title="Next"
                onPress={() => setStep("selectMethod")}
                style={{ marginTop: 12 }}
              />

              <TouchableOpacity style={styles.guestLink} onPress={handleGuest}>
                <Text style={styles.guestText}>Explore as Guest →</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "selectMethod" && (
            <>
              <Text style={styles.sectionTitle}>
                {role === "pandit" ? "Pandit Login" : "Customer Login"}
              </Text>

              <Button
                title="Continue with Phone"
                onPress={() => {
                  setLoginMode("otp");
                  setIdentifierMode("phone");
                  setStep("form");
                }}
                style={styles.methodBtn}
                leftIcon={<Ionicons name="call-outline" size={20} color="#FFF" />}
              />

              <Button
                title="Continue with Email"
                variant="outline"
                onPress={() => {
                  setLoginMode("password");
                  setIdentifierMode("email");
                  setStep("form");
                }}
                style={styles.methodBtn}
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.light.primary} />}
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
                style={styles.googleButton}
                leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
                disabled={!googleRequest || loading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() =>
                    router.push(
                      role === "pandit" ? ("/auth/pandit-register" as any) : ("/auth/customer-register" as any)
                    )
                  }
                >
                  Sign up
                </Text>
              </View>

              <TouchableOpacity style={styles.backLink} onPress={() => setStep("selectRole")}>
                <Text style={styles.backLinkText}>Change role</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "form" && (
            <>
              <View style={styles.segmentRow}>
                <Button
                  title="OTP"
                  variant={loginMode === "otp" ? "primary" : "outline"}
                  onPress={() => setLoginMode("otp")}
                  style={styles.segmentButton}
                />
                <Button
                  title="Password"
                  variant={loginMode === "password" ? "primary" : "outline"}
                  onPress={() => setLoginMode("password")}
                  style={styles.segmentButton}
                />
              </View>

              <View style={styles.segmentRow}>
                <Button
                  title="Phone"
                  variant={identifierMode === "phone" ? "primary" : "outline"}
                  onPress={() => setIdentifierMode("phone")}
                  style={styles.segmentButton}
                />
                <Button
                  title="Email"
                  variant={identifierMode === "email" ? "primary" : "outline"}
                  onPress={() => setIdentifierMode("email")}
                  style={styles.segmentButton}
                />
              </View>

              {identifierMode === "phone" ? (
                <Input
                  label="Phone Number"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              ) : (
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              {loginMode === "password" && (
                <Input
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
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
                style={styles.submitButton}
                disabled={loading}
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
                style={styles.googleButton}
                leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
                disabled={!googleRequest || loading}
              />

              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Colors.light.primary} />
                  <Text style={styles.loadingText}>Working…</Text>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() =>
                    router.push(
                      role === "pandit" ? ("/auth/pandit-register" as any) : ("/auth/customer-register" as any)
                    )
                  }
                >
                  Sign up
                </Text>
              </View>

              <TouchableOpacity style={styles.backLink} onPress={() => setStep("selectMethod")}>
                <Text style={styles.backLinkText}>Back</Text>
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
    marginBottom: 16,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  roleRow: {
    gap: 10,
    marginTop: 12,
  },
  roleBtn: {
    paddingVertical: 12,
  },
  methodBtn: {
    marginTop: 10,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
  },
  submitButton: {
    marginTop: 10,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
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
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 12,
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
  guestLink: {
    marginTop: 18,
    alignItems: "center",
  },
  guestText: {
    color: "#666",
    fontWeight: "600",
  },
  backLink: {
    marginTop: 14,
    alignItems: "center",
  },
  backLinkText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});

