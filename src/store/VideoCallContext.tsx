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
import { ChatMessage } from '@/types/chat';

// Late require for WebRTC to handle Expo Go gracefully
let WebRTC: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebRTC = require('react-native-webrtc');
} catch {
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

const { RTCPeerConnection, mediaDevices, RTCIceCandidate, RTCSessionDescription } = WebRTC;

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
  
  startCall: (bookingId: number, userName: string, isPandit: boolean, peerName?: string, peerAvatar?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleVideo: () => void;
  flipCamera: () => void;
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
    setActiveBookingId(null);
    setMessages([]);
    setUnreadCount(0);
    roomIdRef.current = null;
    socket.current = null;
    pc.current = null;
  }, [localStream]);

  const startCall = async (bookingId: number, userName: string, panditRole: boolean, name?: string, avatar?: string) => {
    if (isCallActive) return;
    
    setIsConnecting(true);
    setActiveBookingId(bookingId);
    setIsPandit(panditRole);
    if (name) setPeerName(name);
    if (avatar) setPeerAvatar(avatar);

    try {
      // 1. Notify Backend & Get Room ID
      try {
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
      } catch (e: any) {
        console.error('[VideoContext] Signaling Prep Error:', e.message);
      }

      // 2. Get Local Stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: isFrontCamera ? 'user' : 'environment' },
      });
      setLocalStream(stream);

      // 3. Initialize PeerConnection
      const peer = new RTCPeerConnection(configuration);
      pc.current = peer;

      stream.getTracks().forEach((track: any) => peer.addTrack(track, stream));

      peer.addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      });

      peer.addEventListener('icecandidate', (event: any) => {
        if (event.candidate && socket.current) {
          socket.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          }));
        }
      });

      // 4. Connect Signaling
      const token = await SecureStore.getItemAsync('access_token');
      // Correctly derive WS URL without double slashes
      const wsBase = API_BASE_URL.replace('http', 'ws').replace(/\/api\/?$/, '');
      const fullUrl = `${wsBase}/ws/video/${bookingId}/?token=${token}`;
      
      console.log('[VideoContext] Connecting to Signaling:', fullUrl);
      socket.current = new WebSocket(fullUrl);

      const connectionTimeout = setTimeout(() => {
        if (isConnecting && !isCallActive) {
          console.warn('[VideoContext] Signaling connection timed out');
          setIsConnecting(false);
          // Set call active anyway in mock mode so they can see the UI
          if (WebRTC.isMock) setIsCallActive(true);
        }
      }, 10000);

      socket.current.onopen = () => {
        console.log('[VideoContext] Signaling Connected');
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
        setIsCallActive(true);
      };

      socket.current.onerror = (e) => {
        console.error('[VideoContext] Signaling Error:', e);
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
      };

      socket.current.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        switch (data.type) {
          case 'offer':
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.current?.send(JSON.stringify({ type: 'answer', sdp: answer }));
            break;
          case 'answer':
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
            break;
          case 'ice-candidate':
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
          case 'participant-joined':
            if (panditRole) {
              const offer = await peer.createOffer();
              await peer.setLocalDescription(offer);
              socket.current?.send(JSON.stringify({ type: 'offer', sdp: offer }));
            }
            break;
          case 'chat':
            onChatMessage(data, bookingId);
            break;
          case 'chat-history':
            setMessages(data.messages.map((m: any) => ({
                id: m.chat_id,
                chatId: bookingId.toString(),
                senderId: m.sender === 'user' ? 'customer' : 'pandit',
                text: m.message,
                type: 'text',
                timestamp: new Date(m.timestamp).getTime(),
                isRead: true,
            })));
            break;
        }
      };

    } catch (err) {
      console.error('[VideoContext] Error starting call:', err);
      Alert.alert('Call Error', 'Could not initialize video call.');
      cleanup();
    }
  };

  const onChatMessage = (data: any, bookingId: number) => {
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
    setUnreadCount((c) => c + 1);
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
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOn(track.enabled);
      }
    }
  };

  const flipCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => track._switchCamera());
      setIsFrontCamera(!isFrontCamera);
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !socket.current) return;
    socket.current.send(JSON.stringify({ type: 'chat', message: text }));
  };

  const clearUnread = () => setUnreadCount(0);

  return (
    <VideoCallContext.Provider value={{
      localStream, remoteStream, isCallActive, isConnecting,
      isMicOn, isVideoOn, isFrontCamera, messages, unreadCount,
      activeBookingId, peerName, peerAvatar, isPandit,
      startCall, endCall, toggleMic, toggleVideo, flipCamera, sendMessage, clearUnread
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
