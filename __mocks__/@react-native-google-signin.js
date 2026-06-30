export const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  signIn: jest.fn(() =>
    Promise.resolve({
      idToken: 'mock-id-token',
      user: {
        id: 'mock-user-id',
        name: 'Mock User',
        email: 'mock@example.com',
        photo: 'https://example.com/photo.jpg',
      },
    })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  isSignedIn: jest.fn(() => Promise.resolve(false)),
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};
