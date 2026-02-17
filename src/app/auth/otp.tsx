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
import { verifyOtp, getMe } from "@/services/auth.service";

export default function OTPScreen() {
  const router = useRouter();
  const { email, phone } = useLocalSearchParams();
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

      // Verify OTP
      const res = await verifyOtp(email as string, otpString, phone as string);

      // Load profile
      const user = await getMe();

      // Route by role
      if (user.role === "pandit") {
        router.replace("/(pandit)" as any);
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard" as any);
      } else {
        router.replace("/(customer)" as any);
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
                    style={{width: 80, height: 80, resizeMode: 'contain'}} 
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
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  verifyButton: {
    width: "100%",
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
  },
  resendLink: {
    fontWeight: "bold",
  },
});