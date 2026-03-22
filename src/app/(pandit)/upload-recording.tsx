import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/store/ThemeContext';
import { Button } from '@/components/ui/Button';
import { uploadBookingRecording } from '@/services/video.service';

export default function UploadRecordingScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handlePickVideo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                setVideoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Pick video error:', error);
            Alert.alert('Error', 'Failed to pick video from library.');
        }
    };

    const handleUpload = async () => {
        if (!videoUri || !bookingId) return;

        try {
            setUploading(true);
            setProgress(0);
            
            // Note: Axios with FormData doesn't provide easy progress out of the box in React Native 
            // without custom XHR wrapper, but we'll show an indeterminate state for now.
            await uploadBookingRecording(parseInt(bookingId), videoUri);
            
            Alert.alert('Success', 'Session recording uploaded successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Error', error.message || 'Failed to upload recording.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#EEE' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Session Recording</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoText, { color: isDark ? '#AAA' : '#666' }]}>
                        You can upload the recorded video of the completed Puja session here. This will be available for the customer to view.
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.uploadArea, 
                        { 
                            backgroundColor: colors.card, 
                            borderColor: videoUri ? colors.primary : (isDark ? '#444' : '#DDD'),
                            borderStyle: videoUri ? 'solid' : 'dashed'
                        }
                    ]} 
                    onPress={handlePickVideo}
                    disabled={uploading}
                >
                    {videoUri ? (
                        <View style={styles.selectedVideoContainer}>
                            <Ionicons name="videocam" size={48} color={colors.primary} />
                            <Text style={[styles.videoName, { color: colors.text }]}>Video Selected</Text>
                            <TouchableOpacity style={styles.changeButton} onPress={handlePickVideo}>
                                <Text style={{ color: colors.primary }}>Change Video</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="cloud-upload-outline" size={60} color={isDark ? '#666' : '#999'} />
                            <Text style={[styles.uploadLabel, { color: colors.text }]}>Select Recording</Text>
                            <Text style={styles.uploadSubtitle}>MP4, MOV supported</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {uploading && (
                    <View style={styles.progressContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.progressText, { color: colors.text }]}>Uploading your recording...</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Button 
                        title={uploading ? "Uploading..." : "Start Upload"}
                        onPress={handleUpload}
                        variant="primary"
                        disabled={!videoUri || uploading}
                        isLoading={uploading}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
        gap: 25,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    uploadArea: {
        height: 250,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContainer: {
        alignItems: 'center',
        gap: 10,
    },
    uploadLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    uploadSubtitle: {
        fontSize: 14,
        color: '#999',
    },
    selectedVideoContainer: {
        alignItems: 'center',
        gap: 10,
    },
    videoName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    changeButton: {
        marginTop: 5,
    },
    progressContainer: {
        alignItems: 'center',
        gap: 12,
    },
    progressText: {
        fontSize: 15,
        fontWeight: '500',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 20,
    },
});
