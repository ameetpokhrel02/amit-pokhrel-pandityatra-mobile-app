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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Colors } from "@/constants/Colors";
import { verifyOtp, login, getMe } from "@/services/auth.service";

export default function OTPScreen() {
  const router = useRouter();
  const { email, phone } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter valid 6 digit OTP");
      return;
    }

    try {
      setLoading(true);

      // 1. Verify OTP & Login in one step
      // Pass phone as third argument if needed by backend, though email might suffice
      const res = await verifyOtp(email as string, otp, phone as string);

      // 2. Load profile
      // res.user might already contain the user profile depending on backend
      const user = await getMe();

      // 3. Route by role
      if (user.role === "pandit") {
        router.replace("/(pandit)" as any);
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard" as any);
      } else {
        router.replace("/(customer)" as any);
      }
    } catch (err) {
      Alert.alert("Invalid OTP", "Verification failed");
    } finally {
      setLoading(false);
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

          <Text style={styles.title}>Verify OTP Code</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {email || phone}
          </Text>

          <Input
            // label="OTP Code"
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />

          <Button
            title={loading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={loading}
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive code? </Text>
            <Text style={styles.link}>Resend</Text>
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
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 32,
  },
  otpInput: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 0,
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