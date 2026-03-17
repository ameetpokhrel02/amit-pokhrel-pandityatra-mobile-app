import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { registerUser } from '@/services/auth.service';

// Minimal Pandit registration:
// 1) create user with role=pandit via /api/users/register/
// 2) user can then login and complete pandit profile via /api/pandits/register/ (handled elsewhere)
export default function PanditRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!fullName || !phone || !password) {
      Alert.alert('Required', 'Please fill in required fields');
      return;
    }
    try {
      setLoading(true);
      await registerUser({
        full_name: fullName,
        phone_number: phone,
        email,
        password,
        role: 'pandit',
      });
      
      router.push({
        pathname: '/auth/otp',
        params: { phone, email, mode: 'register' }
      } as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Registration failed', e.response?.data?.detail || e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Join as Pandit</Text>
        <View style={{ width: 32 }} />
      </View>

      <Input label="Full name" placeholder="Pandit name" value={fullName} onChangeText={setFullName} />
      <Input label="Phone" placeholder="98XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

      <Button
        title={loading ? 'Creating…' : 'Create Pandit account'}
        onPress={handleSubmit}
        disabled={loading}
        style={{ marginTop: 16 }}
        leftIcon={loading ? <ActivityIndicator color="#fff" /> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
});
