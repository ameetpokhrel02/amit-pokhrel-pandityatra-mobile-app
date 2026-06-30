export const requestMediaLibraryPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const requestCameraPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const launchImageLibraryAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    assets: [
      {
        uri: 'file://mock-image.jpg',
        width: 1080,
        height: 1920,
        type: 'image',
      },
    ],
  })
);

export const launchCameraAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    assets: [
      {
        uri: 'file://mock-camera-image.jpg',
        width: 1080,
        height: 1920,
        type: 'image',
      },
    ],
  })
);

export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};
