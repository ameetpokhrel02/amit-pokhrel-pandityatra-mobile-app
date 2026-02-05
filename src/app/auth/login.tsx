import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";
import { requestOtp } from "@/services/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    console.log("handleLogin started", { email, phone });
    try {
      if (!email && !phone) {
        Alert.alert("Error", "Please enter phone or email");
        return;
      }

      console.log("Calling requestOtp...");
      const res = await requestOtp(email, phone);
      console.log("requestOtp response:", res);

      console.log("Navigating to /auth/otp");
      router.push({
        pathname: "/auth/otp",
        params: { email, phone },
      });
    } catch (err) {
      console.error("handleLogin error:", err);
      Alert.alert("OTP Error", "Failed to send OTP. Try again.");
    }
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
              placeholder="+61XXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          ) : (
            <Input
              label="Email Address"
              placeholder="anita@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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

          <Button title="Send OTP" onPress={handleLogin} style={styles.submitButton} />

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
    marginBottom: 24,
  },
  methodContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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