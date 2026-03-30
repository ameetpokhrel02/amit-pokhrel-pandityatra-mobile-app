import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { resetPassword } from '@/services/auth.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        email: email as string,
        otp: otp,
        new_password: newPassword
      });
      Alert.alert(
        'Success', 
        'Password reset successfully!',
        [{ text: 'Login Now', onPress: () => router.replace('/(auth)/user/login') }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.detail || e.message || 'Failed to reset password');
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
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              className="w-[140px] h-[140px] mb-2"
              contentFit="contain"
            />
            <Text className="text-[20px] font-[800] text-primary text-center">Reset Password</Text>
            <Text className="text-zinc-500 text-center font-medium mt-2 leading-5 px-4">
              Enter the 6-digit code sent to{"\n"}
              <Text className="text-zinc-800 font-bold">{email}</Text>
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Reset Code"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Ionicons name="shield-outline" size={20} color="#9CA3AF" />}
            />

            <View>
              <Input
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                }
              />
            </View>

            <View>
              <Input
                label="Confirm New Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              />
            </View>

            <TouchableOpacity
              className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mt-6 shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white text-lg font-bold">Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center mt-8" 
              onPress={() => router.back()}
            >
              <Text className="text-zinc-400 font-semibold px-4 py-2">← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
