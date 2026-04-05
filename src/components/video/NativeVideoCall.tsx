import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  StatusBar,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';
import { useVideoCall } from '@/store/VideoCallContext';
import { useRouter } from 'expo-router';

let WebRTC: any = {};
try {
  WebRTC = require('react-native-webrtc');
} catch (e) {
  console.warn('[NativeVideo] WebRTC native module not found, using mocks.');
  WebRTC = {
    RTCPeerConnection: class { },
    RTCView: ({ children }: any) => <View style={{ flex: 1, backgroundColor: '#222' }}>{children}</View>,
    mediaDevices: { },
    RTCSessionDescription: class {},
    RTCIceCandidate: class {},
    MediaStream: class { },
  };
}

const { RTCView } = WebRTC;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 120;
const BUBBLE_HEIGHT = 160;

export const NativeVideoCall: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

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
    isPandit: callIsPandit,
    isRecording,
    isHandRaised,
    toggleRecording,
    toggleHandRaise,
    isMinimized,
    setIsMinimized,
  } = useVideoCall();

  // UI States
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState('');

  const chatListRef = useRef<FlatList>(null);
  
  // DRAG LOGIC
  const pan = useRef(new RNAnimated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - 20, y: 100 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isMinimized,
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
    })
  ).current;

  // Don't render anything if there's no active call
  if (!isCallActive && !isConnecting) return null;

  const handleEndCall = async () => {
    const bookingId = activeBookingId;
    const wasCustomer = !callIsPandit;
    await endCall();
    if (wasCustomer && bookingId) {
       router.push(`/(customer)/bookings/pandit-feedback?bookingId=${bookingId}` as any);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const toggleChat = () => {
    if (!showChat) clearUnread();
    setShowChat(!showChat);
  };

  const containerStyle = isMinimized 
    ? [styles.bubble, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]
    : styles.fullScreen;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <RNAnimated.View 
        {...(isMinimized ? panResponder.panHandlers : {})}
        style={containerStyle}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          style={styles.content}
        >
          {/* Main Video Background (Remote or Local fallback) */}
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

          {!isMinimized && (
            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
              <View style={styles.topContainer}>
                <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={styles.headerBlur}>
                  <View style={styles.header}>
                    <TouchableOpacity onPress={() => setIsMinimized(true)} style={styles.iconBtn}>
                      <Ionicons name="chevron-down" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <View style={styles.peerInfo}>
                      <Image 
                        source={{ uri: getImageUrl(peerAvatar) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                        style={styles.peerAvatarSmall} 
                      />
                      <View>
                        <Text style={styles.peerNameText}>{peerName || 'Active Session'}</Text>
                        <View style={styles.secureRow}>
                          <Ionicons name="lock-closed" size={10} color="#10B981" />
                          <Text style={styles.secureText}>End-to-end encrypted</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={flipCamera} style={styles.iconBtn}>
                            <Ionicons name="camera-reverse" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              </View>

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

              <View style={styles.controlsWrapper}>
                <BlurView intensity={70} tint="dark" style={styles.actionsBlur}>
                  <View style={styles.bottomActions}>
                    <TouchableOpacity 
                        onPress={toggleChat} 
                        style={[styles.actionBtn, showChat && { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="chatbubble-ellipses" size={22} color="white" />
                      {!showChat && unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={toggleHandRaise} 
                        style={[styles.actionBtn, isHandRaised && { backgroundColor: '#F59E0B' }]}
                    >
                      <Ionicons name={isHandRaised ? "hand-right" : "hand-right-outline"} size={22} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleMic} style={[styles.actionBtn, !isMicOn && styles.btnOff]}>
                      <Ionicons name={isMicOn ? "mic" : "mic-off"} size={22} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleEndCall} 
                      style={[styles.actionBtn, styles.endBtn]}
                    >
                      <Ionicons name="call" size={26} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleVideo} style={[styles.actionBtn, !isVideoOn && styles.btnOff]}>
                      <Ionicons name={isVideoOn ? "videocam" : "videocam-off"} size={22} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={toggleRecording} 
                        style={[styles.actionBtn, isRecording && { backgroundColor: '#EF4444' }]}
                    >
                      <Ionicons name={isRecording ? "radio-button-on" : "videocam-outline"} size={22} color="white" />
                      {isRecording && <View style={styles.recordingDot} />}
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </View>

              {showChat && (
                <MotiView 
                    from={{ translateY: 400 }}
                    animate={{ translateY: 0 }}
                    style={styles.chatWindow}
                >
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>Live Session Chat</Text>
                        <TouchableOpacity onPress={() => setShowChat(false)}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        ref={chatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        onContentSizeChange={() => chatListRef.current?.scrollToEnd()}
                        renderItem={({ item }) => (
                            <View style={[
                                styles.messageBubble, 
                                item.senderId === (callIsPandit ? 'pandit' : 'customer') ? styles.myMessage : styles.theirMessage
                            ]}>
                                <Text style={styles.messageText}>{item.text}</Text>
                                <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        )}
                        style={styles.messageList}
                        contentContainerStyle={{ padding: 16 }}
                    />

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={styles.chatInputRow}>
                            <TextInput
                                style={styles.chatInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a message..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                            <TouchableOpacity onPress={handleSendMessage} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
                                <Ionicons name="send" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </MotiView>
              )}
            </SafeAreaView>
          )}

          {isMinimized && (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => setIsMinimized(false)} 
              style={styles.bubbleOverlay}
            >
               <View style={styles.miniLabel}>
                  <Text style={styles.miniText}>{isConnecting ? 'Connecting...' : 'Active'}</Text>
               </View>
            </TouchableOpacity>
          )}

          {isConnecting && !isMinimized && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Connecting sacred session...</Text>
              
              <TouchableOpacity 
                style={styles.exitBtn} 
                onPress={handleEndCall}
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.exitBtnText}>Exit Setup</Text>
              </TouchableOpacity>
            </View>
          )}

        </MotiView>
      </RNAnimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10000,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#111',
    overflow: 'hidden',
    zIndex: 10001,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  headerBlur: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peerAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  peerNameText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  secureText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
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
  controlsWrapper: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  actionsBlur: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  recordingDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  btnOff: {
    backgroundColor: '#EF4444',
  },
  endBtn: {
    backgroundColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  bubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  miniLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 2,
    alignItems: 'center',
  },
  miniText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.8,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  exitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatWindow: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    height: 400,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6F00',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: 'white',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6F00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
