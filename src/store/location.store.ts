import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Localization from 'expo-localization';
import * as TaskManager from 'expo-task-manager';
import { useCurrencyStore } from './currency.store';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

export interface LocationState {
  countryCode: string | null;
  countryName: string | null;
  phoneCode: string | null;
  isNepal: boolean;
  isCustomLocation: boolean;
  isBackgroundTrackingEnabled: boolean;
  lastBackgroundUpdate: string | null;

  // Actions
  detectLocation: () => Promise<void>;
  setLocation: (countryCode: string, countryName: string, phoneCode: string) => void;
  startBackgroundTracking: () => Promise<boolean>;
  stopBackgroundTracking: () => Promise<void>;
}

const COUNTRY_MAP: Record<string, { name: string; phoneCode: string; currency: 'NPR' | 'USD' }> = {
  'NP': { name: 'Nepal', phoneCode: '+977', currency: 'NPR' },
  'US': { name: 'United States', phoneCode: '+1', currency: 'USD' },
  'IN': { name: 'India', phoneCode: '+91', currency: 'USD' },
  // Default fallback for others can be added here or handled in detection
};

// Define background task handler before creating the store
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocation] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations?.[0];

    if (location) {
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const countryCode = geocode[0].isoCountryCode || 'NP';
          const isNepal = countryCode === 'NP';
          const countryInfo = COUNTRY_MAP[countryCode] || {
            name: countryCode,
            phoneCode: '',
            currency: 'USD'
          };

          // Update store with background location data
          useLocationStore.setState({
            countryCode,
            countryName: countryInfo.name,
            phoneCode: countryInfo.phoneCode,
            isNepal,
            lastBackgroundUpdate: new Date().toISOString(),
          });

          // Sync currency
          useCurrencyStore.getState().setCurrency(countryInfo.currency);

          console.log('[BackgroundLocation] Updated:', countryInfo.name);
        }
      } catch (err) {
        console.warn('[BackgroundLocation] Geocode failed:', err);
      }
    }
  }
});

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      countryCode: 'NP',
      countryName: 'Nepal',
      phoneCode: '+977',
      isNepal: true,
      isCustomLocation: false,
      isBackgroundTrackingEnabled: false,
      lastBackgroundUpdate: null,

      detectLocation: async () => {
        let detectedCountryCode = 'NP'; // Default to Nepal

        try {
          // 1. Check if location services are enabled
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          
          if (servicesEnabled) {
            // 2. Try to get permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status === 'granted') {
              // 3. Attempt to get current position
              try {
                // 3a. Try last known position first (fast)
                let location = await Location.getLastKnownPositionAsync({});
                
                if (!location) {
                  // 3b. Fallback to current position if no last known (slower)
                  location = await Location.getCurrentPositionAsync({ 
                    accuracy: Location.Accuracy.Balanced,
                  });
                }
                
                // 4. Reverse geocode
                const geocode = await Location.reverseGeocodeAsync({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });

                if (geocode && geocode.length > 0) {
                  detectedCountryCode = geocode[0].isoCountryCode || 'NP';
                }
              } catch (posError) {
                console.warn('[LocationStore] GPS failed, falling back to Localization:', posError);
                throw posError; // Trigger outer catch fallback
              }
            } else {
              throw new Error('Location permission denied');
            }
          } else {
            throw new Error('Location services disabled');
          }
        } catch (error) {
          // 5. Final fallback to Localization (Device Locale) if any of the above fails
          const locales = Localization.getLocales();
          if (locales && locales.length > 0) {
            detectedCountryCode = locales[0].regionCode || 'NP';
          }
        }

        // 6. Update state and sync currency
        const isNepal = detectedCountryCode === 'NP';
        const countryInfo = COUNTRY_MAP[detectedCountryCode] || { 
          name: detectedCountryCode, // Use code as name if not in map
          phoneCode: '', 
          currency: 'USD' 
        };

        set({
          countryCode: detectedCountryCode,
          countryName: countryInfo.name,
          phoneCode: countryInfo.phoneCode,
          isNepal,
        });

        // Sync currency store
        useCurrencyStore.getState().setCurrency(countryInfo.currency);
      },

      setLocation: (countryCode, countryName, phoneCode) => {
        const isNepal = countryCode === 'NP';
        set({
          countryCode,
          countryName,
          phoneCode,
          isNepal,
          isCustomLocation: true
        });

        useCurrencyStore.getState().setCurrency(isNepal ? 'NPR' : 'USD');
      },

      startBackgroundTracking: async () => {
        try {
          // Check if location services are enabled
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            console.warn('[BackgroundLocation] Location services disabled');
            return false;
          }

          // Request foreground permission first
          const foreground = await Location.requestForegroundPermissionsAsync();
          if (foreground.status !== 'granted') {
            console.warn('[BackgroundLocation] Foreground permission denied');
            return false;
          }

          // Request background permission
          const background = await Location.requestBackgroundPermissionsAsync();
          if (background.status !== 'granted') {
            console.warn('[BackgroundLocation] Background permission denied');
            return false;
          }

          // Check if task is already registered
          const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

          if (!isRegistered) {
            // Start background location updates
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 300000, // 5 minutes
              distanceInterval: 500, // 500 meters
              deferredUpdatesInterval: 300000, // 5 minutes
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: 'PanditYatra Location',
                notificationBody: 'Tracking location for nearby pandit discovery and delivery coordination',
                notificationColor: '#f97316',
              },
            });

            set({ isBackgroundTrackingEnabled: true });
            console.log('[BackgroundLocation] Started successfully');
            return true;
          } else {
            set({ isBackgroundTrackingEnabled: true });
            console.log('[BackgroundLocation] Already running');
            return true;
          }
        } catch (error) {
          console.error('[BackgroundLocation] Start failed:', error);
          set({ isBackgroundTrackingEnabled: false });
          return false;
        }
      },

      stopBackgroundTracking: async () => {
        try {
          const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

          if (isRegistered) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            console.log('[BackgroundLocation] Stopped successfully');
          }

          set({ isBackgroundTrackingEnabled: false });
        } catch (error) {
          console.error('[BackgroundLocation] Stop failed:', error);
        }
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
