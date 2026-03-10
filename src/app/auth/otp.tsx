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
  Image,
} from "react-native";
// import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { verifyOtpAndGetToken, fetchProfile } from "@/services/auth.service";

export default function OTPScreen() {
  const router = useRouter();
  const { email, phone, mode } = useLocalSearchParams<{ email: string; phone: string; mode: string }>();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(30);

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
        const { verifyPasswordResetOtp } = require('@/services/auth.service');
        const res = await verifyPasswordResetOtp({ email: emailStr, otp: otpString });
        router.push({
          pathname: "/auth/reset-password",
          params: { token: res.token, email: emailStr },
        });
      } else {
        // Verify OTP (Login or Register)
        const res = await verifyOtpAndGetToken({
          email: emailStr,
          phone_number: phoneStr,
          otp_code: otpString
        });

        // Load profile
        const user = await fetchProfile();

        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user', JSON.stringify({
          name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          role: user.role,
          photoUri: user.profile_pic_url
        }));

        // Route by role
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
      Alert.alert("Invalid OTP", err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      // Mock resend
      setTimer(30);
      Alert.alert('Sent', 'OTP has been resent');
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
          <View style={styles.iconContainer}>
            <Image
              source={require("../../../assets/images/pandit-logo.png")}
              style={{ width: 80, height: 80, resizeMode: 'contain' }}
            />
          </View>

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to your phone/email
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  { borderColor: digit ? Colors.light.primary : '#E0E0E0' }
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
            <Text style={styles.verifyButtonText}>
              {loading ? "Verifying..." : "Verify"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResend}
            disabled={timer > 0}
          >
            <Text style={styles.resendText}>
              Didn't receive code? <Text style={[styles.resendLink, { color: timer > 0 ? '#999' : Colors.light.primary }]}>
                {timer > 0 ? `Resend` : "Resend"}
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
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    marginTop: 0,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 30,
    width: '100%',
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  verifyButton: {
    backgroundColor: Colors.light.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    padding: 10,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    fontWeight: '600',
  },
});