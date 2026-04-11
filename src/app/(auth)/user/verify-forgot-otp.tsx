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
import { verifyForgotOTP, requestPasswordResetOTP } from '@/services/auth.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VerifyForgotOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
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
      await verifyForgotOTP({ 
        email: email as string, 
        otp: otpValue 
      });

      // OTP verified successfully, proceed to set new password
      router.replace({ 
        pathname: '/(auth)/user/reset-password', 
        params: { email, otp: otpValue } 
      });
      
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
      await requestPasswordResetOTP({ email: email as string });
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to resend OTP');
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
              source={require('@/assets/images/pandit-logo.png')}
              className="w-[120px] h-[120px] mb-4"
              contentFit="contain"
            />
            <Text className="text-[24px] font-[800] text-zinc-800 text-center mb-2">Verify OTP</Text>
            <Text className="text-zinc-500 text-center font-medium mt-1 leading-5">
              Enter the code sent to your phone/email
            </Text>
          </View>

          <View className="flex-row justify-between mb-8">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                className={`w-[45px] h-[55px] border-2 rounded-xl text-center text-xl font-bold bg-white ${digit ? 'border-primary' : 'border-zinc-200'}`}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={v => handleOtpChange(v, index)}
                onKeyPress={e => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity
            className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mb-6 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white text-[16px] font-bold">Verify</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-center">
            {timer > 0 ? (
              <Text className="text-zinc-500 font-medium">Resend code in <Text className="text-primary font-bold">{timer}s</Text></Text>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-zinc-500 font-medium">Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  <Text className={`text-primary font-bold text-base ${resending ? 'opacity-50' : ''}`}>
                    {resending ? 'Resending...' : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
