import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Localization from 'expo-localization';
import { useCurrencyStore } from './currency.store';

export interface LocationState {
  countryCode: string | null;
  countryName: string | null;
  phoneCode: string | null;
  isNepal: boolean;
  isCustomLocation: boolean;
  
  // Actions
  detectLocation: () => Promise<void>;
  setLocation: (countryCode: string, countryName: string, phoneCode: string) => void;
}

const COUNTRY_MAP: Record<string, { name: string; phoneCode: string; currency: 'NPR' | 'USD' }> = {
  'NP': { name: 'Nepal', phoneCode: '+977', currency: 'NPR' },
  'US': { name: 'United States', phoneCode: '+1', currency: 'USD' },
  'IN': { name: 'India', phoneCode: '+91', currency: 'USD' },
  // Default fallback for others can be added here or handled in detection
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      countryCode: 'NP',
      countryName: 'Nepal',
      phoneCode: '+977',
      isNepal: true,
      isCustomLocation: false,

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
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
