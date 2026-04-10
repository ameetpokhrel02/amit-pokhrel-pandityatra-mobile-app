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

// Lazy loading of Native WebRTC for better startup performance
const getWebRTC = () => {
  try {
    return require('react-native-webrtc');
  } catch (e) {
    console.warn('[VideoContext] WebRTC native module not available, using fallback Mock');
    return {
      RTCPeerConnection: class { 
        addEventListener() {} removeEventListener() {} addTrack() {} close() {}
        setRemoteDescription() {} setLocalDescription() {}
        createAnswer() { return Promise.resolve({ sdp: '', type: 'answer' }); }
        createOffer() { return Promise.resolve({ sdp: '', type: 'offer' }); }
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
 
  startCall: (bookingId: number, userName: string, isPandit: boolean, peerName?: string, peerAvatar?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleVideo: () => void;
  flipCamera: () => void;
  toggleHandRaise: () => void;
  toggleRecording: () => void;
  sendMessage: (text: string) => void;
  clearUnread: () => void;
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
  
  const [isMinimized, setIsMinimized] = useState(false);

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
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
    });
    setUnreadCount((c) => c + 1);
  }, []);

  const startCall = async (bookingId: number, userName: string, panditRole: boolean, name?: string, avatar?: string) => {
    if (isCallActive) return;
    
    setIsConnecting(true);
    setActiveBookingId(bookingId);
    setIsPandit(panditRole);
    if (name) setPeerName(name);
    if (avatar) setPeerAvatar(avatar);

    try {
      // 1. Get Room ID
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

      // Fetch history
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

      // 2. Start Media
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });
      setLocalStream(stream);

      // 3. Start Peer Connection
      const peerConn = new RTCPeerConnection(configuration);
      pc.current = peerConn;
      
      stream.getTracks().forEach((track: any) => {
        peerConn.addTrack(track, stream);
      });

      peerConn.onicecandidate = (event: any) => {
        if (event.candidate && socket.current) {
          socket.current.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
        }
      };

      peerConn.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // 4. Start Signaling
      const token = await SecureStore.getItemAsync('access_token');
      const wsUrl = API_BASE_URL.replace('http', 'ws').replace(/\/api\/?$/, '');
      const ws = new (WebSocket as any)(`${wsUrl}/ws/video/${roomId}/?token=${token}`, undefined, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      socket.current = ws;

      ws.onopen = () => {
        console.log('[NativeWebRTC] Signaling connected');
        setIsConnecting(false);
        setIsCallActive(true);
      };

      ws.onmessage = async (e: any) => {
        const data = JSON.parse(e.data);
        switch (data.type) {
          case 'offer':
            await peerConn.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConn.createAnswer();
            await peerConn.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            break;
          case 'answer':
            await peerConn.setRemoteDescription(new RTCSessionDescription(data.sdp));
            break;
          case 'ice-candidate':
            await peerConn.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
          case 'participant-joined':
            if (panditRole) {
              const offer = await peerConn.createOffer();
              await peerConn.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
            }
            break;
          case 'chat':
            onChatMessage({
              message: data.message,
              sender: data.sender || (data.username === userName ? (panditRole ? 'pandit' : 'customer') : (panditRole ? 'customer' : 'pandit')),
              timestamp: data.timestamp,
            }, bookingId);
            break;
          case 'hand_raise':
            setIsHandRaised(data.isRaised);
            break;
          case 'toggle_recording':
            setIsRecording(data.isRecording);
            break;
        }
      };

      ws.onerror = (e: any) => {
        console.error('[NativeWebRTC] Socket error:', e);
      };
      
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
    if (localStream) {
      localStream.getAudioTracks().forEach((t: any) => { t.enabled = nextState; });
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    if (localStream) {
      localStream.getVideoTracks().forEach((t: any) => { t.enabled = nextState; });
    }
  };

  const flipCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => {
        if (track._switchCamera) {
          track._switchCamera();
        }
      });
    }
  };
 
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: 'hand_raise', isRaised: nextState }));
    }
  };
 
  const toggleRecording = () => {
    const nextState = !isRecording;
    setIsRecording(nextState);
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: 'toggle_recording', isRecording: nextState }));
    }
  };
 
  const sendMessage = (text: string) => {
    if (!text.trim() || !socket.current) return;
    if (socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: 'chat', message: text }));
    }
  };

  const clearUnread = () => setUnreadCount(0);

  return (
    <VideoCallContext.Provider value={{
      localStream, remoteStream, isCallActive, isConnecting,
      isMicOn, isVideoOn, isFrontCamera, messages, unreadCount,
      activeBookingId, peerName, peerAvatar, isPandit,
      isRecording, isHandRaised,
      isMinimized, setIsMinimized,
      startCall, endCall, toggleMic, toggleVideo, flipCamera, 
      toggleHandRaise, toggleRecording,
      sendMessage, clearUnread
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
