import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Image as RNImage, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { submitBugReport } from '@/services/bug-report.service';

// Safe dynamic import for Device
let Device: any;
try {
  Device = require('expo-device');
} catch (e) {
  console.warn('[BugReport] expo-device module not available');
  Device = { brand: 'Unknown', modelName: 'Emulator', osName: Platform.OS, osVersion: 'Unknown' };
}

const CATEGORIES = [
  { label: "User Interface", value: "UI" },
  { label: "Functional Bug", value: "FUNCTIONAL" },
  { label: "Performance", value: "PERFORMANCE" },
  { label: "Security", value: "SECURITY" },
  { label: "Other", value: "OTHER" },
];

const SEVERITIES = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUG_SUCCESS_ICON = 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776945463/image-Photoroom_ohcynd.png';

export default function BugReportScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuthStore();
  
  const [form, setForm] = useState({ 
    title: '', 
    description: '',
    category: 'FUNCTIONAL',
    severity: 'MEDIUM'
  });
  const [attachment, setAttachment] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to upload screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Support images and videos/PDFs if possible
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      // Validate File Size (Secure Check)
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('File too large', 'Please select an image smaller than 5MB.');
        return;
      }

      setAttachment({
        uri: asset.uri,
        name: asset.fileName || `bug_report_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg'
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const deviceInfo = `${Device?.brand || 'Device'} ${Device?.modelName || ''} (${Device?.osName || ''} ${Device?.osVersion || ''})`;
      
      await submitBugReport({
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        device_info: deviceInfo,
        role: user?.role || 'guest',
        attachment: attachment
      });

      setForm({
        title: '',
        description: '',
        category: 'FUNCTIONAL',
        severity: 'MEDIUM',
      });
      setAttachment(null);
      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Report a Bug</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border + '55' }]}> 
          <View style={[styles.heroIconWrap, { backgroundColor: colors.primary + '15' }]}> 
            <Ionicons name="bug-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Help Us Fix Faster</Text>
            <Text style={[styles.subtitle, { color: colors.text + '90' }]}> 
              Share what happened, when it happened, and attach a screenshot if you can.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border + '55' }]}> 
            <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.value}
                  style={[
                    styles.chip, 
                    { borderColor: colors.border, backgroundColor: isDark ? '#111827' : '#FFF' },
                    form.category === cat.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setForm({...form, category: cat.value})}
                >
                  <Text style={[styles.chipText, { color: colors.text }, form.category === cat.value && { color: '#FFF' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border + '66' }]} />

            <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Severity</Text>
            <View style={styles.chipContainer}>
              {SEVERITIES.map((sev) => (
                <TouchableOpacity 
                  key={sev.value}
                  style={[
                    styles.chip, 
                    { borderColor: colors.border, backgroundColor: isDark ? '#111827' : '#FFF' },
                    form.severity === sev.value && { backgroundColor: getSeverityColor(sev.value), borderColor: getSeverityColor(sev.value) }
                  ]}
                  onPress={() => setForm({...form, severity: sev.value})}
                >
                  <Text style={[styles.chipText, { color: colors.text }, form.severity === sev.value && { color: '#FFF' }]}>
                    {sev.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border + '55' }]}> 
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Issue Title</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., App crashes on checkout"
                placeholderTextColor={colors.text + '50'}
                value={form.title}
                onChangeText={(v) => setForm({...form, title: v})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
                placeholder="Describe steps to reproduce, expected result, and what happened instead..."
                placeholderTextColor={colors.text + '50'}
                multiline
                numberOfLines={7}
                value={form.description}
                onChangeText={(v) => setForm({...form, description: v})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Attachment (Optional)</Text>
              {attachment ? (
                <View style={[styles.attachmentPreview, { borderColor: colors.border }]}> 
                  <RNImage source={{ uri: attachment.uri }} style={styles.previewImage} />
                  <View style={[styles.attachmentMeta, { backgroundColor: isDark ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.9)' }]}> 
                    <Text numberOfLines={1} style={[styles.attachmentName, { color: colors.text }]}>{attachment.name}</Text>
                    <TouchableOpacity style={styles.removeAttachment} onPress={() => setAttachment(null)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.uploadBox, { borderColor: colors.primary + 'AA', backgroundColor: colors.primary + '08' }]}
                  onPress={pickImage}
                >
                  <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
                  <Text style={[styles.uploadText, { color: colors.primary }]}>Upload Screenshot</Text>
                  <Text style={[styles.uploadSubText, { color: colors.text + '70' }]}>PNG/JPG up to 5MB</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.submitText}>Submit Report</Text>
                <Ionicons name="send" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.deviceInfoBox, { backgroundColor: isDark ? '#111827' : '#F7F7F8', borderColor: colors.border + '66' }]}> 
          <Ionicons name="phone-portrait-outline" size={20} color={colors.text + '60'} />
          <Text style={[styles.deviceInfoText, { color: colors.text + '60' }]}>
            Device metadata and role will be included for faster debugging.
          </Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <RNImage source={{ uri: BUG_SUCCESS_ICON }} style={styles.modalIcon} resizeMode="contain" />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thanks for reporting this bug</Text>
            <Text style={[styles.modalMessage, { color: colors.text + 'B3' }]}>
              Our system has received your report. Our team will review it shortly.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getSeverityColor = (sev: string) => {
  switch (sev) {
    case 'LOW': return '#10B981';
    case 'MEDIUM': return '#F59E0B';
    case 'HIGH': return '#EF4444';
    case 'CRITICAL': return '#7C3AED';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  title: { fontSize: 28, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 36 },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: { fontSize: 14, lineHeight: 20 },
  form: { gap: 20 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 16,
  },
  divider: {
    height: 1,
  },
  inputGroup: { gap: 12 },
  label: { fontSize: 15, fontWeight: '700' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  input: { 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: { height: 130, textAlignVertical: 'top' },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: { fontSize: 15, fontWeight: '800' },
  uploadSubText: { fontSize: 12, fontWeight: '500' },
  attachmentPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
    borderWidth: 1,
  },
  previewImage: { width: '100%', height: '100%' },
  attachmentMeta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  removeAttachment: {
    backgroundColor: '#FFF',
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: { 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 2,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deviceInfoBox: { 
    marginTop: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 40
  },
  deviceInfoText: { fontSize: 13, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  modalIcon: {
    width: 86,
    height: 86,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButton: {
    minWidth: 120,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
