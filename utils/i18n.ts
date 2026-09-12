import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/supabase';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ht from '../locales/ht.json';

const LANGUAGE_KEY = 'user-language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    // 1. Check if user has explicitly set a language
    const savedLanguage = storage.getString(LANGUAGE_KEY);
    if (savedLanguage) {
      return callback(savedLanguage);
    }

    // 2. Fall back to device language
    // e.g. 'fr-FR', 'ht', 'en-US'
    const bestLanguage = Localization.getLocales()[0]?.languageCode;
    
    if (bestLanguage && ['en', 'fr', 'ht'].includes(bestLanguage)) {
      return callback(bestLanguage);
    }
    
    // Default to English
    return callback('en');
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    storage.set(LANGUAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en,
      fr,
      ht
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
