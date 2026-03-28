import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  TextInput,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { verifyOTP, requestOTP, getProfile } from '@/services/auth.service';
import { useAuthStore } from "@/store/auth.store";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OTPScreen() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const { phone, email, mode } = useLocalSearchParams<{ phone: string; email: string; mode: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      Alert.alert('Error', 'Please enter complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOTP({ 
        phone_number: phone as string, 
        otp: otpValue 
      });

      // If registration mode, the backend returns tokens directly or we need to login
      if (res.data.access) {
        const tokens = { access: res.data.access, refresh: res.data.refresh };
        const userData = res.data.user || { role: res.data.role || 'user' };
        await loginStore.login(userData, tokens);
        
        if (userData.role === 'pandit') router.replace('/(pandit)');
        else router.replace('/(customer)');
      } else {
        // Fallback or specific logic for login verification
        Alert.alert('Success', 'Phone verified!', [
          { text: 'Continue', onPress: () => router.replace('/(auth)/user/login') }
        ]);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Verification Failed', e.response?.data?.detail || e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    try {
      setResending(true);
      await requestOTP({ phone_number: phone as string });
      setTimer(30);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-zinc-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, minHeight: SCREEN_HEIGHT }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/10 w-full max-w-[450px] self-center">
          <View className="items-center mb-8">
            <Image
              source={require("../../../../assets/images/pandit-logo.png")}
              className="w-[140px] h-[140px] mb-2"
              contentFit="contain"
            />
            <Text className="text-[20px] font-[800] text-primary text-center">Verify Phone</Text>
            <Text className="text-zinc-500 text-center font-medium mt-2 leading-5 px-2">
              We&apos;ve sent a 6-digit code to{"\n"}
              <Text className="text-zinc-800 font-bold">{phone}</Text>
            </Text>
          </View>

          <View className="flex-row justify-between mb-8">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                className={`w-[45px] h-[55px] border-2 rounded-xl text-center text-xl font-bold bg-zinc-50 ${digit ? 'border-primary' : 'border-zinc-200'}`}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={v => handleOtpChange(v, index)}
                onKeyPress={e => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity
            className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mb-6 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white text-lg font-bold">Verify & Proceed</Text>
            )}
          </TouchableOpacity>

          <View className="items-center">
            {timer > 0 ? (
              <Text className="text-zinc-500 font-medium">Resend code in <Text className="text-primary font-bold">{timer}s</Text></Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text className={`text-primary font-bold text-base ${resending ? 'opacity-50' : ''}`}>
                  {resending ? 'Resending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            className="items-center mt-8" 
            onPress={() => router.back()}
          >
            <Text className="text-zinc-400 font-semibold px-4 py-2">← Change Number</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}