import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { getBooking } from '@/services/booking.service';
import { useAuthStore } from '@/store/auth.store';
import { useVideoCall } from '@/store/VideoCallContext';
import { Ionicons } from '@expo/vector-icons';

export default function VideoCallScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const { startCall, setIsMinimized, isCallActive, activeBookingId } = useVideoCall();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const isPandit = user?.role === 'pandit';

    useEffect(() => {
        if (bookingId) {
            handleCallLogic();
        }
    }, [bookingId]);

    const handleCallLogic = async () => {
        try {
            setLoading(true);
            const idNum = parseInt(bookingId!);

            // Ensure the persistent call is expanded
            setIsMinimized(false);

            // Fetch peer info for the context
            const bookingRes = await getBooking(idNum);
            const booking = bookingRes.data;

            let peerName = 'User';
            let peerAvatar = '';

            if (isPandit) {
                peerName = booking.user_full_name || 'Customer';
                peerAvatar = booking.user_profile_pic || booking.user_image;
            } else {
                peerName = booking.pandit_full_name || booking.pandit_details?.user_details?.full_name || 'Pandit Ji';
                peerAvatar = booking.pandit_details?.user_details?.profile_pic || booking.pandit_image;
            }

            // Start the call in the global context if not already active
            if (!isCallActive || activeBookingId !== idNum) {
                await startCall(idNum, user?.name || (isPandit ? 'Pandit Ji' : 'Customer'), isPandit, peerName, peerAvatar);
            }

        } catch (error) {
            console.error('Video call logic failed:', error);
            Alert.alert('Error', 'Failed to initialize session.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    {isPandit ? 'Preparing session for your devotee...' : 'Preparing your sacred session...'}
                </Text>
            </View>
        );
    }

    // This screen now just acts as an "Anchor" or Background for the Floating UI
    // The actual video is rendered by PersistentVideoCall in _layout.tsx
    return (
        <View style={styles.container}>
            <View style={styles.center}>
                <Ionicons name="videocam" size={64} color="#333" />
                <Text style={styles.overlayText}>Session Active</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Continue App Use</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    overlayText: {
        color: '#666',
        marginTop: 20,
        fontSize: 18,
    },
    backBtn: {
        marginTop: 40,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: '#222',
    },
    backBtnText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
