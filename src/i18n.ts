import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import np from './locales/np.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  np: { translation: np },
  hi: { translation: hi },
};

// Initialize immediately to prevent race conditions/Suspense errors
i18n.use(initReactI18next).init({
  resources,
  lng: 'np', // Default startup language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
  react: {
    useSuspense: false, // Disable Suspense to prevent crashes if not wrapped
  },
});

// Load saved language asynchronously
AsyncStorage.getItem('language').then((savedLanguage) => {
  if (savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
});

export default i18n;
