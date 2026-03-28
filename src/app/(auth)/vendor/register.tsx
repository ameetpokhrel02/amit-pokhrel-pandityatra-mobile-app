import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { registerVendor } from '@/services/vendor.service';

const BUSINESS_TYPES = ['Samagri Store', 'Book Store', 'Gift & Accessories', 'Devotional Items', 'Other'];

export default function VendorRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Step 2 — Shop
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const validateStep1 = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all personal details.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!shopName.trim() || !address.trim() || !city.trim() || !bankAccount.trim() || !bankName.trim() || !accountHolder.trim()) {
      Alert.alert('Missing Fields', 'Please complete all shop and bank details.');
      return;
    }
    try {
      setLoading(true);
      await registerVendor({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        shop_name: shopName.trim(),
        business_type: businessType,
        address: address.trim(),
        city: city.trim(),
        bank_account_number: bankAccount.trim(),
        bank_name: bankName.trim(),
        account_holder_name: accountHolder.trim(),
      });
      Alert.alert(
        '🎉 Registration Successful!',
        'Your vendor account has been submitted for admin approval. You will be notified once verified.',
        [{ text: 'Login', onPress: () => router.replace('/(auth)/vendor/login' as any) }]
      );
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object'
        ? Object.values(data).flat().join('\n')
        : (data?.detail || 'Registration failed. Please try again.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.inputWrap, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#E5E7EB' }];
  const textStyle = [styles.input, { color: colors.text }];
  const phColor = colors.text + '50';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}>
        {/* Header */}
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="store-plus" size={40} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Become a Vendor</Text>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
          {[1, 2].map(s => (
            <View key={s} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: step >= s ? colors.primary : (isDark ? '#333' : '#E5E7EB') }
              ]}>
                <Text style={[styles.stepNum, { color: step >= s ? '#FFF' : colors.text + '60' }]}>{s}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step >= s ? colors.primary : colors.text + '50' }]}>
                {s === 1 ? 'Personal' : 'Shop Info'}
              </Text>
            </View>
          ))}
          <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : (isDark ? '#333' : '#E5E7EB') }]} />
        </View>

        {step === 1 ? (
          /* ── Step 1: Personal ── */
          <View style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

            <View style={inputStyle}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Full Name" placeholderTextColor={phColor} value={fullName} onChangeText={setFullName} />
            </View>

            <View style={inputStyle}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Email Address" placeholderTextColor={phColor} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>

            <View style={inputStyle}>
              <Ionicons name="call-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Phone Number" placeholderTextColor={phColor} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

            <View style={inputStyle}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Password (min 6 chars)" placeholderTextColor={phColor} secureTextEntry={!showPwd} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.text + '60'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => { if (validateStep1()) setStep(2); }}
            >
              <Text style={styles.btnText}>Next: Shop Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Step 2: Shop ── */
          <View style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Information</Text>

            <View style={inputStyle}>
              <MaterialCommunityIcons name="store-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Shop Name" placeholderTextColor={phColor} value={shopName} onChangeText={setShopName} />
            </View>

            {/* Business Type Selector */}
            <View style={[styles.pickerWrap, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#E5E7EB' }]}>
              <MaterialCommunityIcons name="tag-outline" size={18} color={colors.primary} style={styles.icon} />
              <Text style={[styles.pickerLabel, { color: colors.text + '60' }]}>Business Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.typeRow}>
                  {BUSINESS_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, { backgroundColor: businessType === t ? colors.primary : (isDark ? '#333' : '#F3F4F6'), borderColor: businessType === t ? colors.primary : 'transparent' }]}
                      onPress={() => setBusinessType(t)}
                    >
                      <Text style={{ color: businessType === t ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={inputStyle}>
              <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Street Address" placeholderTextColor={phColor} value={address} onChangeText={setAddress} />
            </View>

            <View style={inputStyle}>
              <Ionicons name="business-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="City" placeholderTextColor={phColor} value={city} onChangeText={setCity} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>Bank Details</Text>

            <View style={inputStyle}>
              <Ionicons name="card-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Bank Account Number" placeholderTextColor={phColor} keyboardType="number-pad" value={bankAccount} onChangeText={setBankAccount} />
            </View>

            <View style={inputStyle}>
              <MaterialCommunityIcons name="bank-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Bank Name (e.g. Nepal Bank)" placeholderTextColor={phColor} value={bankName} onChangeText={setBankName} />
            </View>

            <View style={inputStyle}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={styles.icon} />
              <TextInput style={textStyle} placeholder="Account Holder Name" placeholderTextColor={phColor} value={accountHolder} onChangeText={setAccountHolder} />
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <MaterialCommunityIcons name="store-check" size={18} color="#FFF" />
                    <Text style={styles.btnText}>Submit for Approval</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 28, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32, position: 'relative' },
  stepItem: { alignItems: 'center', gap: 4, zIndex: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  stepNum: { fontSize: 14, fontWeight: '800' },
  stepLabel: { fontSize: 11, fontWeight: '700' },
  stepLine: { position: 'absolute', left: '25%', right: '25%', height: 2, top: 18, zIndex: 0 },
  form: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  pickerWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 52 },
  pickerLabel: { fontSize: 12, marginRight: 8, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 18, marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
