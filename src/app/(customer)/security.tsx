import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/store/ThemeContext';
import { getTOTPStatus, setupTOTP, confirmTOTPSetup, disableTOTP } from '@/services/auth.service';
import { Typography } from '@/constants/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppContainer } from '@/components/ui/AppContainer';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  
  // Setup state
  const [setupData, setSetupData] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getTOTPStatus();
      setHas2FA(res.data?.has_2fa);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartSetup = async () => {
    try {
      setSubmitting(true);
      const res = await setupTOTP();
      setSetupData(res.data);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch 2FA QR code.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await Clipboard.setStringAsync(setupData.secret);
      Toast.show({ type: 'success', text1: 'Copied!', text2: 'Paste this into your Authenticator app.' });
    }
  };

  const handleConfirmSetup = async () => {
    if (otpCode.length !== 6) return;
    try {
      setSubmitting(true);
      await confirmTOTPSetup(otpCode);
      Toast.show({ type: 'success', text1: 'Success', text2: '2FA has been permanently enabled.' });
      setHas2FA(true);
      setSetupData(null);
      setOtpCode('');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'The authenticator code is incorrect.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable2FA = async () => {
    if (otpCode.length !== 6) return;
    try {
      setSubmitting(true);
      await disableTOTP(otpCode);
      Toast.show({ type: 'success', text1: 'Disabled', text2: '2FA has been disabled.' });
      setHas2FA(false);
      setOtpCode('');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Authentication failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppContainer>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Security Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: has2FA ? '#22C55E20' : '#EF444420' }]}>
                <Ionicons name={has2FA ? "shield-checkmark" : "shield-half"} size={28} color={has2FA ? "#22C55E" : "#EF4444"} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ ...Typography.h4, color: colors.text }}>Two-Factor Authentication</Text>
                <Text style={{ ...Typography.bodySm, color: colors.textSecondary, marginTop: 4 }}>
                  {has2FA ? "Your account is highly secure." : "Add an extra layer of security."}
                </Text>
              </View>
            </View>

            {has2FA ? (
              <View style={styles.activeContainer}>
                <Text style={{ ...Typography.body, color: colors.textSecondary, marginBottom: 16 }}>
                  To disable 2FA, please verify your identity using your authenticator app.
                </Text>
                <Input
                  label="Authenticator Code"
                  placeholder="123456"
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                />
                <Button 
                  title="Disable 2FA" 
                  variant="outline" 
                  style={{ marginTop: 16, borderColor: '#EF4444' }} 
                  textStyle={{ color: '#EF4444' }}
                  onPress={handleDisable2FA}
                  disabled={submitting || otpCode.length !== 6}
                  isLoading={submitting}
                />
              </View>
            ) : setupData ? (
              <View style={styles.setupContainer}>
                <View style={[styles.qrWrapper, { borderColor: colors.border }]}>
                  <Image source={{ uri: setupData.qr_code }} style={styles.qr} />
                </View>
                
                <Text style={{ ...Typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
                  Can't scan? Copy this secret key manually:
                </Text>
                <TouchableOpacity onPress={handleCopySecret} style={[styles.secretBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ ...Typography.bodyMedium, color: colors.text, fontFamily: 'monospace' }}>
                    {setupData.secret}
                  </Text>
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={{ marginTop: 24 }}>
                  <Input
                    label="Enter generated 6-digit code to confirm"
                    placeholder="123456"
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                  />
                  <Button 
                    title="Confirm & Enable 2FA" 
                    variant="primary" 
                    style={{ marginTop: 16 }} 
                    onPress={handleConfirmSetup}
                    disabled={submitting || otpCode.length !== 6}
                    isLoading={submitting}
                  />
                  <Button 
                    title="Cancel" 
                    variant="text" 
                    style={{ marginTop: 8 }} 
                    onPress={() => { setSetupData(null); setOtpCode(''); }}
                  />
                </View>
              </View>
            ) : (
             <View style={styles.inactiveContainer}>
                <Button 
                  title="Enable Two-Factor Auth" 
                  variant="primary" 
                  onPress={handleStartSetup}
                  isLoading={submitting}
                />
             </View>
            )}
          </View>
        )}
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    ...Typography.h4,
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  inactiveContainer: {
    paddingTop: 8,
  },
  setupContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  qrWrapper: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  qr: {
    width: 200,
    height: 200,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
  }
});
