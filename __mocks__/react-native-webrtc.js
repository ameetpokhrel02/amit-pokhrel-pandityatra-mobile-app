export const RTCPeerConnection = jest.fn(() => ({
  createOffer: jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })),
  createAnswer: jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })),
  setLocalDescription: jest.fn(() => Promise.resolve()),
  setRemoteDescription: jest.fn(() => Promise.resolve()),
  addIceCandidate: jest.fn(() => Promise.resolve()),
  close: jest.fn(),
  connectionState: 'new',
}));

export const RTCSessionDescription = jest.fn();
export const RTCIceCandidate = jest.fn();
export const mediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: jest.fn(() => []),
      getAudioTracks: jest.fn(() => []),
      getVideoTracks: jest.fn(() => []),
    })
  ),
};
