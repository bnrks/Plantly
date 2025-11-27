import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

import tr from './tr.json';
import en from './en.json';

const LANGUAGE_KEY = '@plantly_language';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Cihaz dilini al (native modül olmadan)
const getDeviceLanguage = () => {
  try {
    let locale = 'tr';
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
               'tr';
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier || 'tr';
    }
    return locale.split(/[-_]/)[0];
  } catch {
    return 'tr';
  }
};

// Kayıtlı dili al
export const getStoredLanguage = async () => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lang) return lang;
    
    // Cihaz dilini kontrol et
    const deviceLang = getDeviceLanguage();
    return SUPPORTED_LANGUAGES.some(l => l.code === deviceLang) ? deviceLang : 'tr';
  } catch {
    return 'tr';
  }
};

// Dili kaydet ve değiştir
export const setStoredLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    return true;
  } catch (error) {
    console.error('Dil kaydedilemedi:', error);
    return false;
  }
};

// Mevcut dili al
export const getCurrentLanguage = () => i18n.language;

// i18n başlat
const initI18n = async () => {
  const savedLanguage = await getStoredLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        tr: { translation: tr },
        en: { translation: en },
      },
      lng: savedLanguage,
      fallbackLng: 'tr',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

// Başlat
initI18n();

export default i18n;
