const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
  id: 'mock-socket-id',
};

const io = jest.fn(() => mockSocket);

module.exports = io;
module.exports.mockSocket = mockSocket;
