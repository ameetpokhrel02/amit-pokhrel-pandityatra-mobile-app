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
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { AppContainer } from '@/components/ui/AppContainer';
import { AuthCard } from '@/components/auth/AuthCard';
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
      // Silent navigation instead of popup
      router.push({ pathname: '/(auth)/user/verify-forgot-otp', params: { email } });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.detail || e.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer hideFab>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
          centerContent
        >
          <AuthCard
            role="customer"
            mode="login"
            titleOverride="Forgot Password?"
            hideFooter
          >
            <Text style={{ textAlign: 'center', marginBottom: 24, fontSize: 14, color: '#666', marginTop: -16, lineHeight: 20 }}>
              Don't worry! Enter your email or phone below to receive a password reset code.
            </Text>

            <View style={{ gap: 16 }}>
              <Input
                label="Email Address / Phone"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
              />

              <TouchableOpacity
                style={{ width: '100%', height: 56, backgroundColor: '#F97316', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, opacity: loading ? 0.7 : 1 }}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Send Verification Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 16 }} 
                onPress={() => router.back()}
              >
                <Text style={{ color: '#9CA3AF', fontWeight: '600' }}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
