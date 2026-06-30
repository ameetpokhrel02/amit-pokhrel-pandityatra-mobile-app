// Manual mock for react-native-webrtc

const mockPeerConnection = {
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
  createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  addTrack: jest.fn(),
  close: jest.fn(),
  onicecandidate: null,
  ontrack: null,
};

export const RTCPeerConnection = jest.fn().mockImplementation(() => mockPeerConnection);

export const mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: jest.fn().mockReturnValue([]),
    getVideoTracks: jest.fn().mockReturnValue([]),
    getAudioTracks: jest.fn().mockReturnValue([]),
  }),
  getDisplayMedia: jest.fn().mockResolvedValue({
    getTracks: jest.fn().mockReturnValue([]),
  }),
};

export const RTCIceCandidate = jest.fn().mockImplementation((init: any) => init);
export const RTCSessionDescription = jest.fn().mockImplementation((init: any) => init);
export const MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([]),
}));
