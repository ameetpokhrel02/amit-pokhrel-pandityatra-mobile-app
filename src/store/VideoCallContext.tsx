import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/services/api-client';
import { 
  startVideoRoom, 
  endVideoRoom, 
  joinVideoRoom, 
  fetchVideoRoom 
} from '@/services/video.service';
import { fetchChatRoomMessages } from '@/services/chat.service';
import { getBooking } from '@/services/booking.service';
import { ChatMessage } from '@/types/chat';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

// Lazy loading of Native WebRTC for better startup performance
const getWebRTC = () => {
  try {
    return require('react-native-webrtc');
  } catch (e) {
    console.warn('[VideoContext] WebRTC native module not available, using fallback Mock');
    return {
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
      mediaDevices: { 
        getUserMedia: async () => ({ 
          getTracks: () => [], 
          getVideoTracks: () => [{ enabled: true, stop: () => {}, _switchCamera: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }],
          toURL: () => '' 
        }) 
      },
      isMock: true,
      RTCIceCandidate: class {},
      RTCSessionDescription: class {},
    };
  }
};

// Accessors will be used only inside functions to ensure late-binding
const lazyWebRTC = getWebRTC();
const { RTCPeerConnection, mediaDevices, RTCIceCandidate, RTCSessionDescription } = lazyWebRTC;

interface VideoCallContextType {
  localStream: any | null;
  remoteStream: any | null;
  isCallActive: boolean;
  isConnecting: boolean;
  isMicOn: boolean;
  isVideoOn: boolean;
  isFrontCamera: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  activeBookingId: number | null;
  peerName: string;
  peerAvatar: string | undefined;
  isPandit: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
  
  // Bridge & UI State
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  webViewRef: React.MutableRefObject<any>;
  setWebViewRef: (ref: any) => void;
 
  startCall: (bookingId: number, userName: string, isPandit: boolean, peerName?: string, peerAvatar?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleVideo: () => void;
  flipCamera: () => void;
  toggleHandRaise: () => void;
  toggleRecording: () => void;
  sendMessage: (text: string) => void;
  clearUnread: () => void;
  handleBridgeMessage: (event: any) => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [remoteStream, setRemoteStream] = useState<any | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [peerName, setPeerName] = useState('Partner');
  const [peerAvatar, setPeerAvatar] = useState<string | undefined>(undefined);
  const [isPandit, setIsPandit] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  // Bridge States
  const [isMinimized, setIsMinimized] = useState(false);
  const webViewRef = useRef<any>(null);

  const pc = useRef<any>(null);
  const socket = useRef<WebSocket | null>(null);
  const roomIdRef = useRef<string | number | null>(null);

  const cleanup = useCallback(() => {
    if (socket.current) socket.current.close();
    if (pc.current) pc.current.close();
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    setIsMinimized(false);
    setActiveBookingId(null);
    setMessages([]);
    setUnreadCount(0);
    setIsRecording(false);
    setIsHandRaised(false);
    roomIdRef.current = null;
    socket.current = null;
    pc.current = null;
    // Notify webview to hangup if possible
    if (webViewRef.current) {
        webViewRef.current.injectJavaScript('if(window.hangup) window.hangup()');
    }
  }, [localStream]);

  const onChatMessage = useCallback((data: any, bookingId: number) => {
    const newMessage: ChatMessage = {
      id: data.chat_id || Math.random().toString(),
      chatId: bookingId.toString(),
      senderId: data.sender === 'user' || data.sender === 'customer' ? 'customer' : 'pandit',
      text: data.message,
      type: 'text',
      timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      isRead: true,
    };
    setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
    });
    setUnreadCount((c) => c + 1);
  }, []);

  const handleBridgeMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[VideoBridge]', data.type, data.message || '');

      switch (data.type) {
        case 'signaling_connected':
          setIsConnecting(false);
          setIsCallActive(true);
          break;
        case 'chat_received':
          if (activeBookingId) {
              onChatMessage(data, activeBookingId);
          }
          break;
        case 'error':
          Alert.alert('Call Error', data.message);
          cleanup();
          break;
        case 'log':
          console.log('[VideoBridge LOG]', data.message);
          break;
        case 'recording_status':
          setIsRecording(data.isRecording);
          break;
        case 'hand_raise_status':
          setIsHandRaised(data.isHandRaised);
          break;
      }
    } catch (e) {
      console.error('[VideoBridge] Parse Error:', e);
    }
  }, [cleanup, activeBookingId, onChatMessage]);

  const startCall = async (bookingId: number, userName: string, panditRole: boolean, name?: string, avatar?: string) => {
    if (isCallActive) return;
    
    setIsConnecting(true);
    setActiveBookingId(bookingId);
    setIsPandit(panditRole);
    if (name) setPeerName(name);
    if (avatar) setPeerAvatar(avatar);

    try {
      // 1. Request Permissions
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Audio.requestPermissionsAsync();

      if (cameraStatus.status !== 'granted' || audioStatus.status !== 'granted') {
          Alert.alert(
              'Permissions Needed',
              'Camera and Microphone access are required for sacred video sessions. Please enable them in settings.',
              [{ text: 'OK', onPress: () => cleanup() }]
          );
          return;
      }

      // 2. Notify Backend & Get Room ID
      let roomId: number | string | null = null;
      try {
        const roomRes = await fetchVideoRoom(bookingId);
        roomId = roomRes.id || roomRes.room_id || (roomRes.data && (roomRes.data.id || roomRes.data.room_id));
      } catch {
        const joinRes = await joinVideoRoom(bookingId);
        roomId = joinRes.id || joinRes.room_id || (joinRes.data && (joinRes.data.id || joinRes.data.room_id));
      }
      roomIdRef.current = roomId;
      
      if (panditRole && roomIdRef.current) {
        await startVideoRoom(roomIdRef.current);
      }

      // Fetch initial chat history for the booking
      try {
          const bookingData = await getBooking(bookingId);
          const chatRoomId = bookingData.data?.chat_room;
          if (chatRoomId) {
              const history = await fetchChatRoomMessages(chatRoomId);
              setMessages(history);
              setUnreadCount(0);
          }
      } catch (err) {
          console.error('[VideoContext] History fetch error:', err);
      }
      
    } catch (err) {
      console.error('[VideoContext] Error starting call:', err);
      Alert.alert('Call Error', 'Could not initialize video call.');
      cleanup();
    }
  };

  const endCall = async () => {
    try {
      if (isPandit && roomIdRef.current) {
        await endVideoRoom(roomIdRef.current);
      }
    } catch (err) {
      console.error('[VideoContext] Error ending room:', err);
    } finally {
      cleanup();
    }
  };

  const toggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.toggleMic(${nextState})`);
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.toggleVideo(${nextState})`);
    }
  };

  const flipCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.flipCamera()`);
    }
  };
 
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.toggleHandRaise(${nextState})`);
    }
  };
 
  const toggleRecording = () => {
    const nextState = !isRecording;
    // We update UI immediately for optimism, but wait for signaling if possible
    setIsRecording(nextState);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.toggleRecording(${nextState})`);
    }
  };
 
  const sendMessage = (text: string) => {
    if (!text.trim() || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`window.sendChatMessage("${text.replace(/"/g, '\\"')}")`);
  };

  const clearUnread = () => setUnreadCount(0);

  return (
    <VideoCallContext.Provider value={{
      localStream, remoteStream, isCallActive, isConnecting,
      isMicOn, isVideoOn, isFrontCamera, messages, unreadCount,
      activeBookingId, peerName, peerAvatar, isPandit,
      isRecording, isHandRaised,
      isMinimized, setIsMinimized,
      webViewRef: webViewRef,
      setWebViewRef: (ref) => { webViewRef.current = ref; },
      startCall, endCall, toggleMic, toggleVideo, flipCamera, 
      toggleHandRaise, toggleRecording,
      sendMessage, clearUnread,
      handleBridgeMessage
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) throw new Error('useVideoCall must be used within VideoCallProvider');
  return context;
};
