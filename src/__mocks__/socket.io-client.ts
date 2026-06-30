// Manual mock for socket.io-client
// Tests access the mock socket via (io as any).mockSocket

const mockSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  once: jest.fn(),
  removeAllListeners: jest.fn(),
};

const io = jest.fn(() => mockSocket);
(io as any).mockSocket = mockSocket;

export { mockSocket };
export default io;
