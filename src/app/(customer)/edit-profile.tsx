import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useUser } from '@/store/UserContext';
import { useTheme } from '@/store/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile } from '@/services/auth.service';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useUser();
    const { colors } = useTheme();

    const [fullName, setFullName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [photoUri, setPhotoUri] = useState(user?.photoUri || null);
    const [loading, setLoading] = useState(false);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim() || !phone.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const hasPhotoChanged = photoUri && photoUri !== user?.photoUri;

            if (hasPhotoChanged) {
                // Use FormData for photo upload
                const formData = new FormData();
                formData.append('full_name', fullName);
                formData.append('phone_number', phone);

                // For React Native FormData, we need a special object
                const photoName = photoUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(photoName);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                // @ts-ignore
                formData.append('profile_image', {
                    uri: Platform.OS === 'android' ? photoUri : photoUri.replace('file://', ''),
                    name: photoName,
                    type: type,
                });

                await updateUserProfile(formData);
            } else {
                // Use regular JSON for simple profile updates
                await updateUserProfile({
                    full_name: fullName,
                    phone_number: phone,
                });
            }

            // Update local context
            updateUser({
                name: fullName,
                phone: phone,
                photoUri: photoUri,
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Error', error?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

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

                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name"
                    />
                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="98XXXXXXXX"
                        keyboardType="phone-pad"
                    />

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Email address cannot be changed from the app. Please contact support if you need to update it.</Text>
                    </View>

                    <Button
                        title={loading ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        disabled={loading}
                        style={styles.saveButton}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
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
    saveButton: {
        marginTop: 10,
    },
});
