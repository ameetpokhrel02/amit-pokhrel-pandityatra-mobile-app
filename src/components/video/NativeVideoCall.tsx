import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
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
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [], toURL: () => '' }) },
    RTCSessionDescription: class {},
    RTCIceCandidate: class {},
    MediaStream: class { getTracks() { return []; } toURL() { return ''; } },
  };
}

const {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} = WebRTC;
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import { Image } from 'expo-image';
import { ChatMessage } from '@/types/chat';
import { startVideoRoom, endVideoRoom, joinVideoRoom } from '@/services/video.service';
import apiClient from '@/services/api-client';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NativeVideoCallProps {
  bookingId: number;
  userName: string;
  onLeave: () => void;
  peerName?: string;
  peerAvatar?: string;
  isPandit?: boolean;
}

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const NativeVideoCall: React.FC<NativeVideoCallProps> = ({
  bookingId,
  userName,
  onLeave,
  peerName = 'Pandit Ji',
  peerAvatar,
  isPandit = false,
}) => {
  const { colors } = useTheme();
  
  // WebRTC States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<WebSocket | null>(null);
  
  // UI States
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [connecting, setConnecting] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const chatAnim = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    startCall();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (socket.current) socket.current.close();
    if (pc.current) pc.current.close();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const startCall = async () => {
    try {
      // 1. Notify Backend API
      if (isPandit) {
        try {
           await startVideoRoom(bookingId);
           console.log('[NativeVideo] API: Started Video Room');
        } catch (e: any) {
           console.log('[NativeVideo] API: Room start note:', e.message);
        }
      } else {
        try {
           await joinVideoRoom(bookingId);
           console.log('[NativeVideo] API: Joined Video Room');
        } catch (e: any) {
           console.log('[NativeVideo] API: Room join note:', e.message);
        }
      }

      // 2. Get Local Stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
        },
      }) as MediaStream;
      setLocalStream(stream);

      // 3. Initialize PeerConnection
      const peer = new RTCPeerConnection(configuration);
      pc.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      (peer as any).addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      });

      (peer as any).addEventListener('icecandidate', (event: any) => {
        if (event.candidate && socket.current) {
          socket.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          }));
        }
      });

      // 3. Connect Signaling
      const token = await SecureStore.getItemAsync('access_token');
      const wsUrl = apiClient.defaults.baseURL?.replace('http', 'ws').replace('/api/', '') || 'ws://localhost:8000';
      const fullUrl = `${wsUrl}/ws/video/${bookingId}/?token=${token}`;
      
      socket.current = new WebSocket(fullUrl);

      socket.current.onopen = () => {
        console.log('[NativeVideo] Signaling Connected');
        setConnecting(false);
      };

      socket.current.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        console.log('[NativeVideo] Received:', data.type);

        switch (data.type) {
          case 'offer':
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.current?.send(json({ type: 'answer', sdp: answer }));
            break;
          case 'answer':
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
            break;
          case 'ice-candidate':
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
          case 'participant-joined':
            if (isPandit) {
                 // Pandit usually initiates the offer if they are the "Host"
                 const offer = await peer.createOffer();
                 await peer.setLocalDescription(offer);
                 socket.current?.send(json({ type: 'offer', sdp: offer }));
            }
            break;
          case 'chat':
            onChatMessage(data);
            break;
          case 'chat-history':
            setMessages(data.messages.map(mapHistoryMessage));
            break;
        }
      };

    } catch (err) {
      console.error('[NativeVideo] Error starting call:', err);
      Alert.alert('Camera Error', 'Could not access camera or microphone.');
      onLeave();
    }
  };

  const handleEndCall = async () => {
      try {
          if (isPandit) {
              await endVideoRoom(bookingId);
              console.log('[NativeVideo] API: Ended Video Room');
          }
      } catch (err) {
          console.error('[NativeVideo] API Error ending room:', err);
      } finally {
          onLeave();
      }
  };

  const json = (obj: any) => JSON.stringify(obj);

  const onChatMessage = (data: any) => {
    const newMessage: ChatMessage = {
      id: data.chat_id || Math.random().toString(),
      chatId: bookingId.toString(),
      senderId: data.sender === 'user' ? 'customer' : 'pandit',
      text: data.message,
      type: 'text',
      timestamp: Date.now(),
      isRead: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    if (!showChat) setUnreadCount((c) => c + 1);
  };

  const mapHistoryMessage = (m: any): ChatMessage => ({
      id: m.chat_id,
      chatId: bookingId.toString(),
      senderId: m.sender === 'user' ? 'customer' : 'pandit',
      text: m.message,
      type: 'text',
      timestamp: new Date(m.timestamp).getTime(),
      isRead: true,
  });

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket.current) return;
    socket.current.send(JSON.stringify({ type: 'chat', message: inputText }));
    setInputText('');
  };

  // UI Actions
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const flipCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
         // @ts-ignore
         track._switchCamera();
      });
      setIsFrontCamera(!isFrontCamera);
    }
  };

  const toggleChat = () => {
    const nextValue = !showChat;
    setShowChat(nextValue);
    chatAnim.value = nextValue ? withSpring(0) : withSpring(SCREEN_WIDTH);
    if (nextValue) setUnreadCount(0);
  };

  const animatedChatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chatAnim.value }],
  }));

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
              {connecting ? 'Connecting...' : `${peerName} is joining...`}
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
              <View style={[styles.msgRow, (item.senderId === 'customer' && !isPandit) || (item.senderId === 'pandit' && isPandit) ? styles.msgMe : styles.msgThem]}>
                <View style={[styles.msgBubble, ((item.senderId === 'customer' && !isPandit) || (item.senderId === 'pandit' && isPandit)) ? { backgroundColor: colors.primary } : { backgroundColor: '#333' }]}>
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
    bottom: 100,
    right: 0,
    width: SCREEN_WIDTH * 0.75,
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
});
