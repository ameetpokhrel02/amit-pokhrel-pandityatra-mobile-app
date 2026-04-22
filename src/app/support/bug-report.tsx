import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Image as RNImage } from 'react-native';
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

export default function BugReportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  const [form, setForm] = useState({ 
    title: '', 
    description: '',
    category: 'FUNCTIONAL',
    severity: 'MEDIUM'
  });
  const [attachment, setAttachment] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

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

      Alert.alert('Success', 'Bug report submitted. Thank you for helping us improve!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Report a Bug</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.text + '90' }]}>
          Found something that's not working? Describe it below and attach a screenshot if possible.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.value}
                  style={[
                    styles.chip, 
                    { borderColor: colors.border },
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Severity</Text>
            <View style={styles.chipContainer}>
              {SEVERITIES.map((sev) => (
                <TouchableOpacity 
                  key={sev.value}
                  style={[
                    styles.chip, 
                    { borderColor: colors.border },
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Issue Title</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
              placeholder="e.g., App crashes on checkout"
              placeholderTextColor={colors.text + '40'}
              value={form.title}
              onChangeText={(v) => setForm({...form, title: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
              placeholder="Describe the steps to reproduce the bug..."
              placeholderTextColor={colors.text + '40'}
              multiline
              numberOfLines={6}
              value={form.description}
              onChangeText={(v) => setForm({...form, description: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Attachment (Optional)</Text>
            {attachment ? (
              <View style={styles.attachmentPreview}>
                <RNImage source={{ uri: attachment.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeAttachment} onPress={() => setAttachment(null)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.uploadBox, { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]} 
                onPress={pickImage}
              >
                <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                <Text style={[styles.uploadText, { color: colors.primary }]}>Upload Screenshot (Max 5MB)</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.deviceInfoBox}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.text + '60'} />
          <Text style={[styles.deviceInfoText, { color: colors.text + '60' }]}>
            Device metadata and role will be included for faster debugging.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 20
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  subtitle: { fontSize: 15, marginBottom: 30 },
  form: { gap: 20 },
  inputGroup: { gap: 12 },
  label: { fontSize: 14, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  input: { 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 15
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12
  },
  uploadText: { fontSize: 14, fontWeight: 'bold' },
  attachmentPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative'
  },
  previewImage: { width: '100%', height: '100%' },
  removeAttachment: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 12
  },
  submitButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deviceInfoBox: { 
    marginTop: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#0001', 
    borderRadius: 12,
    gap: 12,
    marginBottom: 40
  },
  deviceInfoText: { fontSize: 13, flex: 1 },
});
