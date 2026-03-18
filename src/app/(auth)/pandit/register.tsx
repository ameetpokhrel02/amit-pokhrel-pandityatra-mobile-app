import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { registerPandit } from '@/services/pandit.service';
import * as ImagePicker from 'expo-image-picker';

export default function PanditRegister() {
  const router = useRouter();
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
      if (!fullName || !email || !password) {
        Alert.alert('Required', 'Please fill in name, email and password');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!expertise || !experience || !bio) {
        Alert.alert('Required', 'Please fill in professional details');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!certificate) {
      Alert.alert('Required', 'Please upload your certification');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone_number', formattedPhone || phone);
    formData.append('email', email);
    formData.append('password', password);
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
      Alert.alert(
        'Success', 
        'Registration submitted! Your profile is pending admin approval.',
        [{ text: 'OK', onPress: () => router.replace('/(public)/role-selection') }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.detail || e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <Input label="Full Name *" placeholder="Aacharya Name" value={fullName} onChangeText={setFullName} />
            <CustomPhoneInput value={phone} onChangeText={setPhone} onFormattedChange={setFormattedPhone} />
            <Input label="Email *" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password *" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title="Next: Professional Details" onPress={handleNext} style={styles.button} />
          </View>
        );
      case 2:
        return (
          <View style={styles.formContainer}>
            <Input label="Expertise (e.g. Vedic, Astrology) *" placeholder="Areas of expertise" value={expertise} onChangeText={setExpertise} />
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Language *</Text>
              <View style={styles.chipRow}>
                {['Hindi', 'English', 'Both'].map((lang) => (
                  <TouchableOpacity 
                    key={lang} 
                    style={[styles.chip, language === lang && styles.activeChip]} 
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[styles.chipText, language === lang && styles.activeChipText]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Input label="Experience (Years) *" placeholder="5" value={experience} onChangeText={setExperience} keyboardType="numeric" />
            <Input label="Short Bio *" placeholder="Tell us about yourself..." value={bio} onChangeText={setBio} multiline numberOfLines={4} textAlignVertical="top" />
            <View style={styles.buttonRow}>
                <Button title="Back" variant="outline" onPress={() => setStep(1)} style={StyleSheet.flatten([styles.button, { flex: 1, marginRight: 8 }])} />
                <Button title="Next: Final Step" onPress={handleNext} style={StyleSheet.flatten([styles.button, { flex: 1.5 }])} />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Upload Certification (Image) *</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {certificate ? (
                <Image source={{ uri: certificate.uri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Tap to pick certification image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#FF6F00" />
                <Text style={styles.infoText}>Your profile will be reviewed by our admin team before you can start providing services.</Text>
            </View>

            <View style={styles.buttonRow}>
                <Button title="Back" variant="outline" onPress={() => setStep(2)} style={StyleSheet.flatten([styles.button, { flex: 1, marginRight: 8 }])} />
                <Button 
                    title={loading ? 'Submitting...' : 'Complete Registration'} 
                    onPress={handleSubmit} 
                    disabled={loading} 
                    style={StyleSheet.flatten([styles.button, { flex: 2 }])} 
                />
            </View>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
            <Image source={require("@/assets/images/pandit-logo.png")} style={styles.logo} contentFit="contain" />
            <Text style={styles.title}>Pandit Registration</Text>
            <View style={styles.stepIndicator}>
                {[1,2,3].map(s => (
                    <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
                ))}
            </View>
        </View>

        {renderStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6F00', marginBottom: 12 },
  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: '#FF6F00' },
  formContainer: { gap: 16 },
  button: { height: 56 },
  buttonRow: { flexDirection: 'row', marginTop: 10 },
  labelContainer: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  activeChip: { backgroundColor: '#FFF7ED', borderColor: '#FF6F00' },
  chipText: { fontSize: 14, color: '#6B7280' },
  activeChipText: { color: '#FF6F00', fontWeight: '600' },
  uploadBox: { height: 200, borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 10 },
  uploadedImage: { width: '100%', height: '100%' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { marginTop: 8, color: '#9CA3AF', fontSize: 14 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#FFF7ED', borderRadius: 8, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 12, color: '#9A3412', lineHeight: 18 },
});
