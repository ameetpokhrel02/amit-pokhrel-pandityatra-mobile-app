import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, ScrollView, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, updateProfile as updateAuthProfile } from '@/services/auth.service';
import { patchPanditProfile } from '@/services/pandit.service';
import { getImageUrl } from '@/utils/image';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, logout, isAuthenticated, syncProfile, setUser } = useAuthStore();
  const isDark = theme === 'dark';
  
  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditProfessionalModal, setShowEditProfessionalModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  
  // Form States
  const [isUpdating, setIsUpdating] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.pandit_profile?.bio || '');
  const [editExperience, setEditExperience] = useState(user?.pandit_profile?.experience_years?.toString() || '0');
  const [isAvailable, setIsAvailable] = useState(user?.pandit_profile?.is_available ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditBio(user.pandit_profile?.bio || '');
      setEditExperience(user.pandit_profile?.experience_years?.toString() || '0');
      setIsAvailable(user.pandit_profile?.is_available ?? true);
    }
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        setIsUpdating(true);
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('profile_image', { uri, name: filename, type } as any);
        
        await updateAuthProfile(formData);
        await syncProfile();
        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (error) {
        console.error('Error updating image:', error);
        Alert.alert('Error', 'Failed to update profile picture.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleUploadCertification = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri && user?.pandit_profile?.id) {
      try {
        setIsUpdating(true);
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'cert.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('certification_image', { uri, name: filename, type } as any);
        
        // This assumes the backend supports cert uploads on the patch endpoint or similar
        // If not, we might need a dedicated endpoint
        await patchPanditProfile(user.pandit_profile.id, formData);
        await syncProfile();
        Alert.alert('Success', 'Certification uploaded successfully!');
      } catch (error) {
        console.error('Error uploading cert:', error);
        Alert.alert('Error', 'Failed to upload certification.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    try {
      setIsUpdating(true);
      await updateAuthProfile({ full_name: editName });
      await syncProfile();
      setShowEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfessional = async () => {
    if (!user?.pandit_profile?.id) return;

    try {
      setIsUpdating(true);
      await patchPanditProfile(user.pandit_profile.id, {
        bio: editBio,
        experience_years: parseInt(editExperience) || 0,
      });
      await syncProfile();
      setShowEditProfessionalModal(false);
      Alert.alert('Success', 'Professional info updated!');
    } catch (error) {
      console.error('Error updating professional bio:', error);
      Alert.alert('Error', 'Failed to update professional info.');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(public)/role-selection');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert("Account Deleted", "Your account has been queued for deletion.");
    logout();
    router.replace('/(public)/role-selection');
  };

  const handleEditPressBasic = () => {
    setShowEditProfileModal(true);
  };

  const handleEditPressProfessional = () => {
    setShowEditProfessionalModal(true);
  };

  const handleEditPressCertification = () => {
    setShowCertificationModal(true);
  };

  const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={24} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.5 }} />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Pandit Profile</Text>
        </View>

        {/* Profile Header Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
            {user?.profile_pic_url || user?.photoUri ? (
              <Image 
                source={{ uri: getImageUrl(user.profile_pic_url || user.photoUri) || undefined }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'P'}</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Pandit Ji'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: user?.pandit_profile?.is_verified ? '#DCFCE7' : '#FEF3C7' }]}>
              <Ionicons name={user?.pandit_profile?.is_verified ? "checkmark-circle" : "time"} size={14} color={user?.pandit_profile?.is_verified ? '#166534' : '#92400E'} />
              <Text style={[styles.roleText, { color: user?.pandit_profile?.is_verified ? '#166534' : '#92400E', marginLeft: 4 }]}>
                {user?.pandit_profile?.is_verified ? 'VERIFIED PANDIT' : 'PENDING VERIFICATION'}
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Bio Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Professional Bio</Text>
            <TouchableOpacity onPress={handleEditPressProfessional}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bioText, { color: colors.text }]}>
            {user?.pandit_profile?.bio || 'Professional Pandit dedicated to Vedic rituals and pujas.'}
          </Text>
        </View>

        {/* Professional Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
                {user?.pandit_profile?.rating || user?.pandit_profile?.average_rating || '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
                {user?.pandit_profile?.review_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Pujas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
                {user?.pandit_profile?.experience_years ? `${user.pandit_profile.experience_years}y` : 'New'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Exp</Text>
          </View>
        </View>


        {/* Professional Menu */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Professional Details</Text>
          {renderSettingItem("newspaper-outline", "Edit Profile Details", handleEditPressBasic)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("sparkles-outline", "My Services", () => router.push('/(pandit)/services' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("basket-outline", "Marketplace / Buy Samagri", () => router.push('/(customer)/shop' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("star-outline", "My Reviews", () => router.push('/(pandit)/reviews' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("wallet-outline", "Earnings & Wallet", () => router.push('/(pandit)/earnings' as any))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("document-lock-outline", "Certifications", handleEditPressCertification)}
        </View>

      {/* Certification Modal */}
      <Modal visible={showCertificationModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certifications</Text>
              <TouchableOpacity onPress={() => setShowCertificationModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {/* List existing certs here if they exist */}
              <View style={styles.certList}>
                 <View style={styles.certItem}>
                   <Ionicons name="ribbon-outline" size={32} color={colors.primary} />
                   <View style={{ flex: 1, marginLeft: 12 }}>
                     <Text style={{ fontWeight: '600', color: colors.text }}>Vedic Shastri Certificate</Text>
                     <Text style={{ fontSize: 12, color: '#666' }}>Verified by PanditYatra</Text>
                   </View>
                   <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
                 </View>
              </View>

              <TouchableOpacity 
                style={[styles.uploadBox, { borderColor: colors.primary }]}
                onPress={handleUploadCertification}
              >
                <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold', marginTop: 8 }}>Upload New Certificate</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>Max size 5MB (JPG, PNG)</Text>
              </TouchableOpacity>
            </ScrollView>

            <Button
              title="Close"
              variant="outline"
              onPress={() => setShowCertificationModal(false)}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

        {/* Activity & Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Activity & Settings</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="flash-outline" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Available for Booking</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderSettingItem("notifications-outline", "Notification Settings", () => { })}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="language" size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Language</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>English</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Support & Account */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support</Text>
          {renderSettingItem("help-circle-outline", "Help & Support", () => router.push('/(pandit)/help'))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem("lock-closed-outline", "Privacy Policy", () => { })}
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Account Actions</Text>
          {renderSettingItem(
            "trash-outline", 
            "Delete Account", 
            () => {
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. All bookings and data will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", onPress: handleDeleteAccount, style: "destructive" }
                ]
              );
            },
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" style={{ opacity: 0.5 }} />
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            "log-out-outline", 
            "Logout", 
            () => setShowLogoutModal(true),
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" style={{ opacity: 0.5 }} />
          )}
        </View>

        <View style={{ height: 160 }} />

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Basic Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
              />
            </View>

            <Button
              title={isUpdating ? "Saving..." : "Save Changes"}
              onPress={handleSaveProfile}
              isLoading={isUpdating}
              style={{ marginTop: 20 }}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Professional Modal */}
      <Modal visible={showEditProfessionalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Professional Bio & Exp</Text>
              <TouchableOpacity onPress={() => setShowEditProfessionalModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                value={editExperience}
                onChangeText={setEditExperience}
                keyboardType="numeric"
                placeholder="e.g. 10"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={4}
                placeholder="Tell us about your Vedic expertise..."
              />
            </View>

            <Button
              title={isUpdating ? "Saving..." : "Save Changes"}
              onPress={handleSaveProfessional}
              isLoading={isUpdating}
              style={{ marginTop: 20 }}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

        <LogoutModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  nameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  certList: {
    marginVertical: 10,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 111, 0, 0.02)',
  },
});
