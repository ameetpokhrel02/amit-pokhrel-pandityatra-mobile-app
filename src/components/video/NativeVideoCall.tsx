import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
let WebRTC: any = {};
try {
  WebRTC = require('react-native-webrtc');
} catch (e) {
  console.warn('[NativeVideo] WebRTC native module not found, using mocks.');
  WebRTC = {
    RTCPeerConnection: class { 
      addEventListener() {} 
      removeEventListener() {} 
      addTrack() {}
      close() {}
      setRemoteDescription() {}
      setLocalDescription() {}
      createAnswer() { return { sdp: '', type: 'answer' }; }
      createOffer() { return { sdp: '', type: 'offer' }; }
      addIceCandidate() {}
    },
    RTCView: ({ children }: any) => <View style={{ flex: 1, backgroundColor: '#222' }}>{children}</View>,
    mediaDevices: { 
      getUserMedia: async () => {
        const mockStream = { 
          getTracks: () => [], 
          getVideoTracks: () => [{ enabled: true, stop: () => {}, _switchCamera: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }],
          toURL: () => '' 
        };
        return mockStream;
      } 
    },
    RTCSessionDescription: class {},
    RTCIceCandidate: class {},
    MediaStream: class { 
      getTracks() { return []; } 
      getVideoTracks() { return [{ enabled: true, stop: () => {}, _switchCamera: () => {} }]; }
      getAudioTracks() { return [{ enabled: true, stop: () => {} }]; }
      toURL() { return ''; } 
    },
  };
}

const { RTCView } = WebRTC;
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import { Image } from 'expo-image';
import { ChatMessage } from '@/types/chat';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';

import { useVideoCall } from '@/store/VideoCallContext';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NativeVideoCallProps {
  bookingId: number;
  userName: string;
  onLeave: () => void;
  peerName?: string;
  peerAvatar?: string;
  isPandit?: boolean;
}

const configuration = {}; // Moved to context

export const NativeVideoCall: React.FC<NativeVideoCallProps> = ({
  bookingId,
  userName,
  onLeave,
  peerName: propPeerName,
  peerAvatar: propPeerAvatar,
  isPandit: propIsPandit = false,
}) => {
  const { colors } = useTheme();
  const { 
    localStream, 
    remoteStream, 
    isConnecting, 
    messages, 
    unreadCount,
    isMicOn,
    isVideoOn,
    isFrontCamera,
    startCall,
    endCall,
    toggleMic,
    toggleVideo,
    flipCamera,
    sendMessage,
    clearUnread,
    isCallActive,
    activeBookingId,
    peerName,
    peerAvatar,
    isPandit: callIsPandit
  } = useVideoCall();

  // UI States
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const chatAnim = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    // If no call is active or a different booking, start it
    if (!isCallActive || activeBookingId !== bookingId) {
      startCall(bookingId, userName, propIsPandit, propPeerName, propPeerAvatar);
    }
  }, [bookingId, isCallActive, activeBookingId]);

  const handleEndCall = async () => {
    await endCall();
    onLeave();
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const toggleChat = () => {
    const nextValue = !showChat;
    setShowChat(nextValue);
    chatAnim.value = nextValue ? withSpring(0) : withSpring(SCREEN_WIDTH);
    if (nextValue) clearUnread();
  };

  const animatedChatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chatAnim.value }],
  }));

  if (isConnecting && !isCallActive) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: 'white', marginTop: 20 }}>Initializing Call...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Remote Video (Full Screen) */}
      <View style={styles.remoteVideoContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={(remoteStream as any).toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.remotePlaceholder}>
            <Image 
              source={{ uri: getImageUrl(peerAvatar) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.remotePlaceholderAvatar}
            />
            <Text style={styles.remotePlaceholderText}>
              {isConnecting ? 'Connecting...' : `${peerName} is joining...`}
            </Text>
          </View>
        )}
      </View>

      {/* Top Header Overlay */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onLeave} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.peerInfo}>
            <Image 
              source={{ uri: getImageUrl(peerAvatar) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.peerAvatarSmall}
            />
            <Text style={styles.peerNameText}>{peerName}</Text>
            {callIsPandit && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>HOST</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={flipCamera} style={styles.headerIconBtn}>
              <Ionicons name="camera-reverse" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Local Video PiP */}
      <View style={styles.localVideoPip}>
        {localStream && isVideoOn ? (
          <RTCView
            streamURL={(localStream as any).toURL()}
            mirror={isFrontCamera}
            style={styles.localVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.localPlaceholder}>
            <Ionicons name="videocam-off" size={20} color="#666" />
          </View>
        )}
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBarContainer}>
        <BlurView intensity={30} tint="dark" style={styles.controlsBlur}>
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              onPress={toggleVideo} 
              style={[styles.controlBtn, !isVideoOn && styles.controlBtnOff]}
            >
              <Ionicons name={isVideoOn ? "videocam" : "videocam-off"} size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleMic} 
              style={[styles.controlBtn, !isMicOn && styles.controlBtnOff]}
            >
              <Ionicons name={isMicOn ? "mic" : "mic-off"} size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {}} style={styles.controlBtn}>
              <Ionicons name="hand-right-outline" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleChat} style={styles.controlBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
              {unreadCount > 0 && <View style={styles.chatBadge} />}
            </TouchableOpacity>
  
            <TouchableOpacity 
              onPress={handleEndCall} 
              style={[styles.controlBtn, styles.endCallBtn]}
            >
              <Ionicons name="call" size={24} color="white" />
              {callIsPandit && <Text style={styles.endCallText}>End for All</Text>}
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Chat Overlay Sidebar */}
      <Animated.View style={[styles.chatDrawer, animatedChatStyle]}>
        <BlurView intensity={90} tint="dark" style={styles.chatBlur}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Live Chat</Text>
            <TouchableOpacity onPress={toggleChat}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, (item.senderId === 'customer' && !callIsPandit) || (item.senderId === 'pandit' && callIsPandit) ? styles.msgMe : styles.msgThem]}>
                <View style={[styles.msgBubble, ((item.senderId === 'customer' && !callIsPandit) || (item.senderId === 'pandit' && callIsPandit)) ? { backgroundColor: colors.primary } : { backgroundColor: '#333' }]}>
                  <Text style={styles.msgText}>{item.text}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={handleSendMessage} style={[styles.chatSendBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
  },
  remoteVideo: {
    flex: 1,
  },
  remotePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  remotePlaceholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#f97316',
  },
  remotePlaceholderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    gap: 8,
  },
  peerAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  peerNameText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  localVideoPip: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 110,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 5,
  },
  localVideo: {
    flex: 1,
  },
  localPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 16,
  },
  controlsBlur: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.6)',
  },
  endCallBtn: {
    backgroundColor: '#EF4444',
    transform: [{ rotate: '135deg' }],
  },
  chatBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#000',
  },
  chatDrawer: {
    position: 'absolute',
    top: 100,
    bottom: 120, // Increased from 100 to clear the bottom controls bar
    right: 0,
    width: SCREEN_WIDTH * 0.85, // Slightly wider for better readability
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: 'hidden',
    zIndex: 20,
  },
  chatBlur: {
    flex: 1,
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chatTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatList: {
    paddingBottom: 20,
  },
  msgRow: {
    marginBottom: 10,
  },
  msgMe: {
    alignItems: 'flex-end',
  },
  msgThem: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: '90%',
  },
  msgText: {
    color: '#FFF',
    fontSize: 14,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 15,
    color: '#FFF',
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  hostBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  endCallText: {
    position: 'absolute',
    bottom: -15,
    fontSize: 8,
    color: '#EF4444',
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
});
