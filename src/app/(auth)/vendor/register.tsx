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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { registerVendor } from '@/services/vendor.service';
import { googleLogin } from '@/services/auth.service';
import { useAuthStore } from "@/store/auth.store";
import Constants from 'expo-constants';
import { isExpoGo } from "@/utils/expo-go";

// Conditionally import GoogleSignin
let GoogleSignin: any = null;
try {
  if (!isExpoGo()) {
    const GoogleAuth = require("@react-native-google-signin/google-signin");
    GoogleSignin = GoogleAuth.GoogleSignin;
  }
} catch (e) {
  console.warn("Google Sign-In native module not found.");
}

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const WEB_CLIENT_ID = EXTRA.webClientId || EXTRA.expoPublicGoogleClientId || "";
const IOS_CLIENT_ID = EXTRA.iosClientId || "";

if (GoogleSignin) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID || undefined,
    iosClientId: IOS_CLIENT_ID || undefined,
  });
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUSINESS_TYPES = ['Samagri Store', 'Book Store', 'Gift & Accessories', 'Devotional Items', 'Other'];

export default function VendorRegister() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Shop Info
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Step 3: Bank Details
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const handleGoogleSignup = async () => {
    if (isExpoGo()) {
      Alert.alert("Expo Go Limited", "Google Sign-In is not available in Expo Go.");
      return;
    }
    if (!GoogleSignin) return;

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      
      if (!idToken) {
         Alert.alert("Google Sign-In", "No id_token returned.");
         return;
      }

      const res = await googleLogin({ id_token: idToken }); 
      const userData = res.data.user;
      
      if (res.data.access) {
         const tokens = { access: res.data.access, refresh: res.data.refresh };
         await loginStore.login(userData, tokens);
         router.replace(userData.role === 'vendor' ? "/(vendor)" : "/(customer)");
         return;
      }

      if (userInfo.data?.user) {
         setFullName(userInfo.data.user.name || '');
         setEmail(userInfo.data.user.email || '');
         setPassword('GOOGLE_AUTH_SESSION');
         Toast.show({ type: 'success', text1: 'Success', text2: 'Info pre-filled from Google!' });
      }
      
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !email.trim()) {
        Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in name and email' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!shopName.trim() || !address.trim() || !city.trim()) {
        Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in shop details' });
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!bankAccount.trim() || !bankName.trim() || !accountHolder.trim()) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in all bank details' });
      return;
    }

    try {
      setLoading(true);
      await registerVendor({
        email: email.trim(),
        password: password || 'GOOGLE_AUTH_SESSION',
        full_name: fullName.trim(),
        phone_number: formattedPhone || phone.trim(),
        shop_name: shopName.trim(),
        business_type: businessType,
        address: address.trim(),
        city: city.trim(),
        bank_account_number: bankAccount.trim(),
        bank_name: bankName.trim(),
        account_holder_name: accountHolder.trim(),
      });
      
      Toast.show({ type: 'success', text1: 'Success', text2: 'Registration submitted! Pending admin approval.' });
      router.replace('/(auth)/vendor/login' as any);
    } catch (e: any) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <View className="gap-2">
            <TouchableOpacity 
              onPress={handleGoogleSignup}
              className="w-full h-14 border border-zinc-200 rounded-2xl flex-row items-center justify-center gap-3 active:bg-zinc-50 mb-2"
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text className="text-zinc-700 font-semibold">Sign up with Google</Text>
            </TouchableOpacity>

            <View className="flex-row items-center my-1">
              <View className="flex-1 h-[1px] bg-zinc-200" />
              <Text className="px-4 text-xs text-zinc-400 font-semibold">OR FILL MANUALLY</Text>
              <View className="flex-1 h-[1px] bg-zinc-200" />
            </View>

            <Input label="Full Name *" placeholder="Owner Name" value={fullName} onChangeText={setFullName} />
            <View className="mb-4">
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Phone Number</Text>
              <CustomPhoneInput value={phone} onChangeText={setPhone} onFormattedChange={setFormattedPhone} />
            </View>
            <Input label="Email *" placeholder="shop@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password *" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
            
            <TouchableOpacity
              className="w-full h-14 bg-primary rounded-2xl items-center justify-center mt-2 shadow-lg shadow-primary/30 active:opacity-80"
              onPress={handleNext}
            >
              <Text className="text-white text-lg font-bold">Next: Shop Details</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View className="gap-2">
            <Input label="Shop Name *" placeholder="Your Shop Name" value={shopName} onChangeText={setShopName} />
            
            <View className="mb-4">
              <Text className="text-sm font-semibold text-zinc-700 mb-2">Business Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {BUSINESS_TYPES.map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    className={`px-4 py-2 rounded-full border-1.5 mr-2 ${businessType === type ? 'bg-orange-50 border-primary' : 'border-zinc-200'}`}
                    onPress={() => setBusinessType(type)}
                  >
                    <Text className={`text-sm ${businessType === type ? 'text-primary font-bold' : 'text-zinc-500 font-medium'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Input label="Street Address *" placeholder="Shop Address" value={address} onChangeText={setAddress} />
            <Input label="City *" placeholder="City Name" value={city} onChangeText={setCity} />

            <View className="flex-row mt-4 gap-3">
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
                <Text className="text-white font-bold">Next: Bank Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View className="gap-2">
             <Input 
              label="Bank Account Number *" 
              placeholder="0000 0000 0000" 
              value={bankAccount} 
              onChangeText={setBankAccount}
              keyboardType="number-pad"
            />
            <Input 
              label="Bank Name *" 
              placeholder="e.g. Nepal Investment Bank" 
              value={bankName} 
              onChangeText={setBankName} 
            />
            <Input 
              label="Account Holder Name *" 
              placeholder="Exact name as in bank" 
              value={accountHolder} 
              onChangeText={setAccountHolder} 
            />
            
            <View className="flex-row mt-4 gap-3">
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
        <View className="bg-white rounded-[40px] p-8 shadow-xl shadow-black/10 w-full max-w-[450px] self-center my-10">
          <View className="items-center mb-8">
             <View className="w-20 h-20 bg-primary/10 rounded-3xl justify-center items-center mb-4">
                <MaterialCommunityIcons name="store-plus" size={40} color="#FF6F00" />
             </View>
            <Text className="text-[20px] font-[800] text-primary text-center mb-4">Become a Vendor</Text>
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
