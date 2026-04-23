import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { registerPandit } from '@/services/pandit.service';
import { useAuthStore } from "@/store/auth.store";
import * as ImagePicker from 'expo-image-picker';
import { signInWithGoogleWebBrowser } from '@/features/auth/google-web-auth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PanditRegister() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Professional Info
  const [expertise, setExpertise] = useState('');
  const [language, setLanguage] = useState('Both'); // Hindi, English, Both
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');

  // Step 3: Certification
  const [certificate, setCertificate] = useState<any>(null);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const res = await signInWithGoogleWebBrowser();
      const userData = res.user;
      
      // If user exists and is a pandit, log them in
      if (res.access && res.refresh) {
         const tokens = { access: res.access, refresh: res.refresh };
         await loginStore.login(userData, tokens);
         Toast.show({
          type: 'success',
          text1: 'Google Sign-In successful',
          text2: 'Welcome back to your pandit dashboard.',
         });
         router.replace(userData.role === 'pandit' ? "/(pandit)" : "/(customer)");
         return;
      }

      // If user doesn't exist, pre-fill step 1
      if (userData) {
         setFullName(userData.name || userData.full_name || '');
         setEmail(userData.email || '');
         setPassword('GOOGLE_AUTH_SESSION'); // Dummy password for backend if needed
         Toast.show({ type: 'success', text1: 'Success', text2: 'Basic info pre-filled from Google!' });
      }
      
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In failed',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCertificate(result.assets[0]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName || !email) {
        Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in name and email' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!expertise || !experience || !bio) {
        Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in professional details' });
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!certificate) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please upload your certification' });
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone_number', formattedPhone || phone);
    formData.append('email', email);
    formData.append('password', password || 'GOOGLE_AUTH_SESSION');
    formData.append('expertise', expertise);
    formData.append('language', language);
    formData.append('experience_years', experience);
    formData.append('bio', bio);
    formData.append('role', 'pandit');

    if (certificate) {
        const uriParts = certificate.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('certification_file', {
          uri: certificate.uri,
          name: `cert.${fileType}`,
          type: `image/${fileType}`,
        } as any);
    }

    try {
      setLoading(true);
      await registerPandit(formData);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Registration submitted! Pending admin approval.' });
      router.replace('/(public)/role-selection');
    } catch (e: any) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.detail || e.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <View className="gap-4">
            <TouchableOpacity 
              onPress={handleGoogleSignup}
              className="w-full h-14 border border-zinc-200 rounded-2xl flex-row items-center justify-center gap-3 active:bg-zinc-50"
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text className="text-zinc-700 font-semibold">Sign up with Google</Text>
            </TouchableOpacity>

            <View className="flex-row items-center my-1">
              <View className="flex-1 h-[1px] bg-zinc-200" />
              <Text className="px-4 text-xs text-zinc-400 font-semibold">OR FILL MANUALLY</Text>
              <View className="flex-1 h-[1px] bg-zinc-200" />
            </View>

            <Input label="Full Name *" placeholder="Aacharya Name" value={fullName} onChangeText={setFullName} />
            <View>
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Phone Number</Text>
              <CustomPhoneInput value={phone} onChangeText={setPhone} onFormattedChange={setFormattedPhone} />
            </View>
            <View>
              <Input label="Email *" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View>
              <Input label="Password *" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <TouchableOpacity
              className="w-full h-14 bg-primary rounded-2xl items-center justify-center mt-2 shadow-lg shadow-primary/30 active:opacity-80"
              onPress={handleNext}
            >
              <Text className="text-white text-lg font-bold">Next: Professional Details</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View className="gap-4">
            <Input label="Expertise (e.g. Vedic, Astrology) *" placeholder="Areas of expertise" value={expertise} onChangeText={setExpertise} />
            <View>
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Language *</Text>
              <View className="flex-row gap-2">
                {['Hindi', 'English', 'Both'].map((lang) => (
                  <TouchableOpacity 
                    key={lang} 
                    className={`px-4 py-2 rounded-full border-1.5 ${language === lang ? 'bg-orange-50 border-primary' : 'border-zinc-200'}`}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text className={`text-sm ${language === lang ? 'text-primary font-bold' : 'text-zinc-500 font-medium'}`}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Input label="Experience (Years) *" placeholder="5" value={experience} onChangeText={setExperience} keyboardType="numeric" />
            <Input label="Short Bio *" placeholder="Tell us about yourself..." value={bio} onChangeText={setBio} multiline numberOfLines={4} textAlignVertical="top" />
            <View className="flex-row mt-2 gap-3">
              <TouchableOpacity
                className="flex-1 h-14 border border-zinc-200 rounded-2xl items-center justify-center active:bg-zinc-50"
                onPress={() => setStep(1)}
              >
                <Text className="text-zinc-500 font-bold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[1.5] h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:opacity-80"
                onPress={handleNext}
              >
                <Text className="text-white font-bold">Next: Final Step</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View className="gap-4">
            <Text className="text-sm font-semibold text-zinc-700">Upload Certification (Image) *</Text>
            <TouchableOpacity 
              className="h-[180px] rounded-2xl border-2 border-dashed border-zinc-200 justify-center items-center overflow-hidden bg-zinc-50" 
              onPress={pickImage}
            >
              {certificate ? (
                <Image source={{ uri: certificate.uri }} className="w-full h-full" />
              ) : (
                <View className="items-center">
                  <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
                  <Text className="mt-2 text-zinc-400 text-sm font-medium text-center">Tap to pick certification image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View className="flex-row gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <Ionicons name="information-circle-outline" size={20} color="#FF6F00" />
                <Text className="flex-1 text-[13px] text-orange-900 leading-[18px] font-medium">Your profile will be reviewed by our admin team.</Text>
            </View>

            <View className="flex-row mt-2 gap-3">
              <TouchableOpacity
                className="flex-1 h-14 border border-zinc-200 rounded-2xl items-center justify-center active:bg-zinc-50"
                onPress={() => setStep(2)}
              >
                <Text className="text-zinc-500 font-bold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-[2] h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:opacity-80 ${loading ? 'opacity-70' : ''}`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white font-bold">Complete Registration</Text>}
              </TouchableOpacity>
            </View>
          </View>
        );
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
        <View className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/10 w-full max-w-[450px] self-center my-10">
          <View className="items-center mb-8">
            <Image source={require('@/assets/images/pandit-logo.png')} className="w-[140px] h-[140px] mb-4" contentFit="contain" />
            <Text className="text-[20px] font-[800] text-primary text-center mb-4">Pandit Registration</Text>
            <View className="flex-row gap-2">
                {[1,2,3].map(s => (
                    <View key={s} className={`w-10 h-1.5 rounded-full ${step >= s ? 'bg-primary' : 'bg-zinc-200'}`} />
                ))}
            </View>
          </View>

          {renderStep()}

          <TouchableOpacity 
            className="items-center mt-6" 
            onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          >
            <Text className="text-zinc-500 font-semibold">← Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
