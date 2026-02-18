import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { fetchVideoRoom, generateVideoJoinLink } from '@/services/video.service';

// Safely import native module
const Daily = (() => {
    try {
        return require('@daily-co/react-native-daily-js').default;
    } catch (e) {
        console.warn('Daily SDK native module not found');
        return null;
    }
})();

const DailyMediaView = (() => {
    try {
        return require('@daily-co/react-native-daily-js').DailyMediaView;
    } catch (e) {
        return null;
    }
})();

const { width } = Dimensions.get('window');

export default function VideoCallScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [callStatus, setCallStatus] = useState<'idle' | 'joining' | 'joined' | 'ended'>('idle');
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);

    const callObject = useRef<any>(null);

    useEffect(() => {
        if (bookingId) {
            initializeCall();
        }
        return () => {
            if (callObject.current) {
                callObject.current.leave();
                callObject.current.destroy();
            }
        };
    }, [bookingId]);

    const initializeCall = async () => {
        try {
            setLoading(true);
            // 1. Fetch room details
            const roomData = await generateVideoJoinLink(parseInt(bookingId));
            setRoomUrl(roomData.room_url);

            // 2. Create Call Object
            if (!Daily || !Daily.createCallObject) {
                Alert.alert(
                    'Native Module Missing',
                    'Daily.co Video SDK requires a development build. It is not available in Expo Go. Please use a development build to test video calls.',
                    [{ text: 'Back', onPress: () => router.back() }]
                );
                return;
            }
            const call = Daily.createCallObject();
            callObject.current = call;

            // 3. Set up event listeners
            call.on('participant-joined', handleParticipantUpdate);
            call.on('participant-updated', handleParticipantUpdate);
            call.on('participant-left', handleParticipantUpdate);
            call.on('joined-meeting', () => setCallStatus('joined'));
            call.on('left-meeting', () => setCallStatus('ended'));
            call.on('error', (error: any) => {
                console.error('Daily error:', error);
                Alert.alert('Error', 'Failed to join video call.');
            });

            // 4. Join the room
            setCallStatus('joining');
            await call.join({ url: roomData.room_url });
        } catch (error) {
            console.error('Video call initialization failed:', error);
            Alert.alert('Error', 'Failed to start video call.');
        } finally {
            setLoading(false);
        }
    };

    const handleParticipantUpdate = () => {
        if (!callObject.current) return;
        const p = callObject.current.participants();
        setParticipants(Object.values(p));
    };

    const toggleAudio = () => {
        if (!callObject.current) return;
        const audioEnabled = callObject.current.localAudio();
        callObject.current.setLocalAudio(!audioEnabled);
    };

    const toggleVideo = () => {
        if (!callObject.current) return;
        const videoEnabled = callObject.current.localVideo();
        callObject.current.setLocalVideo(!videoEnabled);
    };

    const endCall = () => {
        if (callObject.current) {
            callObject.current.leave();
        }
        router.back();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#000' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Preparing your sacred session...</Text>
            </View>
        );
    }

    const localParticipant = participants.find(p => p.local);
    const remoteParticipants = participants.filter(p => !p.local);

    return (
        <View style={styles.container}>
            {/* Main Video View (Remote Participant or Local for preview) */}
            <View style={styles.videoGrid}>
                {(!Daily || participants.length === 0) ? (
                    <View style={styles.placeholderView}>
                        <Text style={styles.placeholderText}>
                            {!Daily ? 'Native Video Support Missing' : 'Connecting...'}
                        </Text>
                    </View>
                ) : remoteParticipants.length > 0 ? (
                    remoteParticipants.map(participant => (
                        DailyMediaView ? (
                            <DailyMediaView
                                key={participant.session_id}
                                style={styles.remoteVideo}
                                videoTrack={participant.videoTrack}
                                audioTrack={participant.audioTrack}
                                objectFit="cover"
                            />
                        ) : (
                            <View key={participant.session_id} style={styles.placeholderView}>
                                <Text style={styles.placeholderText}>Video Unavailable</Text>
                            </View>
                        )
                    ))
                ) : (
                    DailyMediaView ? (
                        <DailyMediaView
                            key={localParticipant?.session_id}
                            style={styles.remoteVideo}
                            videoTrack={localParticipant?.videoTrack}
                            audioTrack={localParticipant?.audioTrack}
                            objectFit="cover"
                            mirror
                        />
                    ) : (
                        <View key={localParticipant?.session_id} style={styles.placeholderView}>
                            <Text style={styles.placeholderText}>Preview Unavailable</Text>
                        </View>
                    )
                )}

            </View>

            {/* Inset Local Video View */}
            {remoteParticipants.length > 0 && localParticipant && DailyMediaView && (
                <View style={styles.localPreview}>
                    <DailyMediaView
                        style={styles.previewView}
                        videoTrack={localParticipant.videoTrack}
                        audioTrack={localParticipant.audioTrack}
                        objectFit="cover"
                        mirror
                    />
                </View>
            )}


            {/* Header / Info */}
            <View style={styles.overlayHeader}>
                <TouchableOpacity onPress={endCall} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="white" />
                </TouchableOpacity>
                <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>Joined Live Puja</Text>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={toggleAudio} style={styles.controlButton}>
                    <Ionicons
                        name={localParticipant?.audio ? "mic" : "mic-off"}
                        size={28}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={endCall}
                    style={[styles.controlButton, styles.endCallButton]}
                >
                    <Ionicons name="call" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleVideo} style={styles.controlButton}>
                    <Ionicons
                        name={localParticipant?.video ? "videocam" : "videocam-off"}
                        size={28}
                        color="white"
                    />
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    videoGrid: {
        flex: 1,
    },
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    placeholderView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
        fontSize: 18,
    },
    localPreview: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    previewView: {
        flex: 1,
    },
    overlayHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    roomInfo: {
        marginLeft: 12,
    },
    roomName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
        marginRight: 4,
    },
    liveText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    controls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    endCallButton: {
        backgroundColor: '#EF4444',
        transform: [{ rotate: '135deg' }],
    },
});
