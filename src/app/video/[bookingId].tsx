import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { getBooking } from '@/services/booking.service';
import { NativeVideoCall } from '@/components/video/NativeVideoCall';
import { useAuthStore } from '@/store/auth.store';

export default function VideoCallScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [peerInfo, setPeerInfo] = useState<{ name: string; avatar?: string }>({ name: 'User' });
    
    const isPandit = user?.role === 'pandit';

    useEffect(() => {
        if (bookingId) {
            prepareCall();
        }
    }, [bookingId]);

    const prepareCall = async () => {
        try {
            setLoading(true);
            const idNum = parseInt(bookingId!);
            
            const bookingRes = await getBooking(idNum);
            const booking = bookingRes.data;
            
            if (isPandit) {
                // Peer for Pandit is the Customer
                setPeerInfo({
                    name: booking.user_full_name || 'Customer',
                    avatar: booking.user_profile_pic || booking.user_image
                });
            } else {
                // Peer for Customer is the Pandit
                setPeerInfo({
                    name: booking.pandit_full_name || booking.pandit_details?.user_details?.full_name || 'Pandit Ji',
                    avatar: booking.pandit_details?.user_details?.profile_pic || booking.pandit_image
                });
            }

        } catch (error) {
            console.error('Video call setup failed:', error);
            Alert.alert('Error', 'Failed to prepare video call session.');
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

    return (
        <NativeVideoCall 
            bookingId={parseInt(bookingId!)}
            userName={user?.name || (isPandit ? 'Pandit Ji' : 'Customer')}
            peerName={peerInfo.name}
            peerAvatar={peerInfo.avatar}
            onLeave={() => router.back()}
            isPandit={isPandit}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
});
