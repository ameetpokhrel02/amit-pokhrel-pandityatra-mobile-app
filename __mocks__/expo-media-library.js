export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const createAssetAsync = jest.fn((uri) =>
  Promise.resolve({
    id: 'mock-asset-id',
    uri,
    filename: 'mock-image.png',
    mediaType: 'photo',
    width: 1080,
    height: 1920,
  })
);

export const saveToLibraryAsync = jest.fn((uri) => Promise.resolve(uri));
