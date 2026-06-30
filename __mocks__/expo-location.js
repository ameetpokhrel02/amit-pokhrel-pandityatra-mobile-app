export const requestForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const requestBackgroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const getForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const getBackgroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
);

export const getCurrentPositionAsync = jest.fn(() =>
  Promise.resolve({
    coords: {
      latitude: 27.7172,
      longitude: 85.324,
      altitude: 1400,
      accuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })
);

export const reverseGeocodeAsync = jest.fn(() =>
  Promise.resolve([
    {
      city: 'Kathmandu',
      country: 'Nepal',
      isoCountryCode: 'NP',
      name: 'Kathmandu',
      postalCode: '44600',
      region: 'Bagmati',
    },
  ])
);

export const hasServicesEnabledAsync = jest.fn(() => Promise.resolve(true));

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};
