import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { loginOTP, getProfile, verifyForgotOTP } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

export default function OTPScreen() {
  const router = useRouter();
  const { email, phone, mode } = useLocalSearchParams<{ email: string; phone: string; mode: string }>();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(30);
  const { login: storeLogin } = useAuthStore();

  const identifier = email || phone || "your device";

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer for resend
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      Alert.alert("Error", "Enter valid 6 digit OTP");
      return;
    }

    try {
      setLoading(true);
      const emailStr = Array.isArray(email) ? email[0] : email;
      const phoneStr = Array.isArray(phone) ? phone[0] : phone;

      if (mode === 'reset-password') {
        const res = await verifyForgotOTP({ email: emailStr, otp: otpString });
        router.push({
          pathname: "/auth/reset-password",
          params: { token: res.data.token, email: emailStr },
        } as any);
      } else {
        // Verify OTP (Login or Register)
        const verifyPayload: any = { otp_code: otpString };
        if (phoneStr) verifyPayload.phone_number = phoneStr;
        if (emailStr) verifyPayload.email = emailStr;

        const verifyRes = await loginOTP(verifyPayload);
        const { access, refresh, user: userData } = verifyRes.data;

        // Load profile for full data if needed, or use userData from login response
        const profileRes = await getProfile();
        const user = profileRes.data;

        const userProfile = {
          id: user.id.toString(),
          name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          role: user.role,
          profile_pic_url: user.profile_pic_url,
        };

        await storeLogin(userProfile, { access, refresh });

        // Route by role
        if (user.role === "pandit") {
          const isProfileComplete = user.is_pandit_profile_complete || user.pandit_profile;
          if (isProfileComplete) {
            router.replace("/(pandit)" as any);
          } else {
            router.replace("/auth/pandit-profile-setup" as any);
          }
        } else if (user.role === "admin") {
          // Mobile app doesn't have intensive admin UI in this roadmap, 
          // but we can route to an admin section if needed.
          router.replace("/admin/dashboard" as any);
        } else {
          router.replace("/(customer)" as any);
        }
      }
    } catch (err: any) {
      console.error("[OTP Verify Error]", err);
      Alert.alert("Invalid OTP", err.response?.data?.detail || err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      // Logic for resend OTP should go here (calling requestOTP service)
      setTimer(30);
      Alert.alert('Sent', 'A new OTP has been sent.');
    } catch (e) {
      Alert.alert('Error', 'Failed to resend OTP');
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

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.identifier}>{identifier}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  { borderColor: digit ? Colors.light.primary : "#E0E0E0" },
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
                cursorColor={Colors.light.primary}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResend}
            disabled={timer > 0}
          >
            <Text style={styles.resendText}>
              Didn't receive code?{" "}
              <Text
                style={[
                  styles.resendLink,
                  { color: timer > 0 ? "#999" : Colors.light.primary },
                ]}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
              </Text>
            </Text>
          </TouchableOpacity>
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
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 35,
    textAlign: "center",
    lineHeight: 22,
  },
  identifier: {
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 40,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  verifyButton: {
    backgroundColor: Colors.light.primary,
    width: "100%",
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendContainer: {
    padding: 10,
  },
  resendText: {
    color: "#666",
    fontSize: 14,
  },
  resendLink: {
    fontWeight: "700",
  },
});