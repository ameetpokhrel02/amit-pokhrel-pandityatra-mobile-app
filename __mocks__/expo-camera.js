export const requestCameraPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const getCameraPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const Camera = {
  Constants: {
    Type: {
      back: 'back',
      front: 'front',
    },
  },
};
