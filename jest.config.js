module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@stripe/stripe-react-native|@react-native-google-signin/google-signin|zustand|moti|socket.io-client|react-native-webrtc|@daily-co/daily-js)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^expo-location$': '<rootDir>/__mocks__/expo-location.js',
    '^expo-camera$': '<rootDir>/__mocks__/expo-camera.js',
    '^expo-media-library$': '<rootDir>/__mocks__/expo-media-library.js',
    '^expo-image-picker$': '<rootDir>/__mocks__/expo-image-picker.js',
    '^@react-native-google-signin/google-signin$': '<rootDir>/__mocks__/@react-native-google-signin.js',
    '^socket.io-client$': '<rootDir>/__mocks__/socket.io-client.js',
    '^react-native-webrtc$': '<rootDir>/__mocks__/react-native-webrtc.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  resetMocks: false,
  resetModules: false,
  restoreMocks: false,
};
