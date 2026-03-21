import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { requestPasswordResetOTP } from '@/services/auth.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordResetOTP({ email });
      Alert.alert(
        'Success', 
        'Reset code sent to your email!',
        [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/user/reset-password', params: { email } }) }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.detail || e.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
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
            <View className="w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="key-outline" size={40} color="#FF6F00" />
            </View>
            <Text className="text-[28px] font-[800] text-primary text-center">Forgot Password?</Text>
            <Text className="text-zinc-500 text-center font-medium mt-2 leading-5 px-4">
              Don't worry! Enter your email below to receive a password reset code.
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
            />

            <TouchableOpacity
              className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mt-6 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white text-lg font-bold">Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center mt-8" 
              onPress={() => router.back()}
            >
              <Text className="text-zinc-400 font-semibold px-4 py-2">← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
