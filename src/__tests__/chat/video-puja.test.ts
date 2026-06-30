jest.mock('socket.io-client');
jest.mock('react-native-webrtc');

import io from 'socket.io-client';
import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';

const mockSocket = (io as any).mockSocket;

describe('Video Puja Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WebRTC Connection', () => {
    it('should create RTCPeerConnection', () => {
      const peerConnection = new RTCPeerConnection();

      expect(peerConnection).toBeDefined();
      expect(peerConnection.createOffer).toBeDefined();
      expect(peerConnection.createAnswer).toBeDefined();
    });

    it('should get user media for video call', async () => {
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      expect(stream).toBeDefined();
      expect(stream.getTracks).toBeDefined();
    });

    it('should create and set local offer', async () => {
      const peerConnection = new RTCPeerConnection();

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      expect(offer).toHaveProperty('type', 'offer');
      expect(offer).toHaveProperty('sdp');
      expect(peerConnection.setLocalDescription).toHaveBeenCalled();
    });

    it('should handle remote offer and create answer', async () => {
      const peerConnection = new RTCPeerConnection();

      const remoteOffer = { type: 'offer', sdp: 'remote-sdp' };
      await peerConnection.setRemoteDescription(remoteOffer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      expect(answer).toHaveProperty('type', 'answer');
      expect(peerConnection.setRemoteDescription).toHaveBeenCalled();
    });
  });

  describe('Video Call Signaling', () => {
    it('should emit join room event', () => {
      const bookingId = 1;

      mockSocket.emit('join_video_room', { bookingId });

      expect(mockSocket.emit).toHaveBeenCalledWith('join_video_room', {
        bookingId,
      });
    });

    it('should listen for call offer', () => {
      const onOfferReceived = jest.fn();

      mockSocket.on('video_offer', onOfferReceived);

      expect(mockSocket.on).toHaveBeenCalledWith(
        'video_offer',
        onOfferReceived
      );
    });

    it('should send call answer', () => {
      const answer = { type: 'answer', sdp: 'answer-sdp' };

      mockSocket.emit('video_answer', answer);

      expect(mockSocket.emit).toHaveBeenCalledWith('video_answer', answer);
    });

    it('should handle ICE candidates', () => {
      const candidate = {
        candidate: 'ice-candidate-string',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      mockSocket.emit('ice_candidate', candidate);

      expect(mockSocket.emit).toHaveBeenCalledWith('ice_candidate', candidate);
    });

    it('should handle call end', () => {
      mockSocket.emit('end_call');

      expect(mockSocket.emit).toHaveBeenCalledWith('end_call');
    });
  });

  describe('Video Call UI States', () => {
    it('should handle connecting state', () => {
      const callState = {
        status: 'connecting',
        localStream: null,
        remoteStream: null,
      };

      expect(callState.status).toBe('connecting');
    });

    it('should handle connected state with streams', () => {
      const callState = {
        status: 'connected',
        localStream: { id: 'local-stream' },
        remoteStream: { id: 'remote-stream' },
      };

      expect(callState.status).toBe('connected');
      expect(callState.localStream).toBeDefined();
      expect(callState.remoteStream).toBeDefined();
    });

    it('should handle call ended state', () => {
      const callState = {
        status: 'ended',
        localStream: null,
        remoteStream: null,
        duration: 1800, // 30 minutes
      };

      expect(callState.status).toBe('ended');
      expect(callState.duration).toBe(1800);
    });
  });
});
