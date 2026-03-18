import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { CustomPhoneInput } from "@/components/ui/CustomPhoneInput";
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from '@/services/auth.service';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useUser();
    const { colors } = useTheme();

    const [fullName, setFullName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [formattedPhone, setFormattedPhone] = useState(user?.phone || '');
    const [photoUri, setPhotoUri] = useState(user?.photoUri || null);
    const [loading, setLoading] = useState(false);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // Lower quality for faster upload
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (!phone || phone.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const hasPhotoChanged = photoUri && photoUri !== user?.photoUri;

            if (hasPhotoChanged) {
                const formData = new FormData();
                formData.append('full_name', fullName);
                formData.append('phone_number', formattedPhone || phone);

                const photoName = photoUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(photoName);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                // @ts-ignore - React Native FormData needs this format
                formData.append('profile_image', {
                    uri: Platform.OS === 'android' ? photoUri : photoUri.replace('file://', ''),
                    name: photoName,
                    type: type,
                });

                await updateProfile(formData);
            } else {
                await updateProfile({
                    full_name: fullName,
                    phone_number: formattedPhone || phone,
                });
            }

            // Update local context
            updateUser({
                name: fullName,
                phone: formattedPhone || phone,
                photoUri: photoUri,
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Update profile error:', error);
            const msg = error?.response?.data?.detail || error?.message || 'Failed to update profile';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Scrollable Form */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Picture */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.placeholderText}>{fullName[0]?.toUpperCase() || 'U'}</Text>
                                </View>
                            )}
                            <View style={[styles.editIconBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Profile Photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your full name"
                        />
                        <View style={styles.phoneInputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                            <CustomPhoneInput
                                value={phone}
                                onChangeText={setPhone}
                                onFormattedChange={setFormattedPhone}
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>Email address cannot be changed from the app. Please contact support if you need to update it.</Text>
                        </View>
                    </View>

                    {/* ===== SAVE BUTTON (Inside ScrollView) ===== */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[styles.cancelBtn, { borderColor: colors.primary }]}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            style={[
                                styles.saveBtn,
                                { backgroundColor: loading ? '#ccc' : colors.primary }
                            ]}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 48,
        color: '#FFF',
        fontWeight: 'bold',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    form: {
        gap: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    phoneInputContainer: {
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },

    /* ===== IN-FLOW BUTTONS ===== */
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 30,
        marginBottom: 20,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 2,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        // Shadow for prominence
        elevation: 4,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
