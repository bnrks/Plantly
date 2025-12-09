// src/services/analyticsService.js
import { getAnalytics, logEvent, setUserId as setAnalyticsUserId, setUserProperties as setAnalyticsUserProperties } from 'firebase/analytics';
import { Platform } from 'react-native';

/**
 * Firebase Analytics Service (JS SDK)
 * Uygulama genelinde analytics event'lerini yönetir
 */

let analyticsInstance = null;

// Analytics instance'ı lazy load et
const getAnalyticsInstance = () => {
  if (!analyticsInstance) {
    try {
      const { app } = require('./firebaseConfig');
      analyticsInstance = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization warning:', error.message);
      return null;
    }
  }
  return analyticsInstance;
};

// Güvenli log fonksiyonu
const safeLogEvent = async (eventName, params = {}) => {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics) {
      await logEvent(analytics, eventName, params);
      console.log('📊 Analytics:', eventName, params);
    }
  } catch (error) {
    console.warn('Analytics event error:', error.message);
  }
};

// Kullanıcı oturumu event'leri
export const logLogin = async (method = 'email') => {
  await safeLogEvent('login', { method });
};

export const logSignUp = async (method = 'email') => {
  await safeLogEvent('sign_up', { method });
};

// Ekran görüntüleme
export const logScreenView = async (screenName, screenClass) => {
  await safeLogEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

// Bitki event'leri
export const logPlantAdded = async (plantData) => {
  await safeLogEvent('plant_added', {
    plant_name: plantData?.name || 'unknown',
    plant_species: plantData?.species || 'unknown',
    has_image: !!plantData?.imageUrl,
  });
};

export const logPlantDeleted = async (plantId) => {
  await safeLogEvent('plant_deleted', {
    plant_id: plantId || 'unknown',
  });
};

export const logPlantAnalyzed = async (plantData) => {
  await safeLogEvent('plant_analyzed', {
    plant_name: plantData?.name || 'unknown',
    disease_detected: plantData?.disease || 'none',
  });
};

export const logPlantWatered = async (plantId) => {
  await safeLogEvent('plant_watered', {
    plant_id: plantId || 'unknown',
  });
};

// Chat event'leri
export const logChatStarted = async () => {
  await safeLogEvent('chat_started', {
    platform: Platform.OS,
  });
};

export const logChatMessageSent = async (messageType = 'text') => {
  await safeLogEvent('chat_message_sent', {
    message_type: messageType,
  });
};

// Eğitim modülü event'leri
export const logEducationModuleViewed = async (moduleId, moduleName) => {
  await safeLogEvent('education_module_viewed', {
    module_id: moduleId || 'unknown',
    module_name: moduleName || 'unknown',
  });
};

// Başarı/rozet event'leri
export const logAchievementUnlocked = async (achievementData) => {
  await safeLogEvent('unlock_achievement', {
    achievement_id: achievementData?.id || 'unknown',
    achievement_name: achievementData?.name || 'unknown',
  });
};

// Genel event
export const logCustomEvent = async (eventName, params = {}) => {
  await safeLogEvent(eventName, params);
};

// Kullanıcı özelliklerini ayarla
export const setUserProperties = async (properties) => {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics && properties) {
      await setAnalyticsUserProperties(analytics, properties);
      console.log('📊 Analytics: User properties set', properties);
    }
  } catch (error) {
    console.warn('Analytics setUserProperties error:', error.message);
  }
};

// Kullanıcı ID'sini ayarla
export const setUserId = async (userId) => {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics && userId) {
      await setAnalyticsUserId(analytics, userId);
      console.log('📊 Analytics: User ID set');
    }
  } catch (error) {
    console.warn('Analytics setUserId error:', error.message);
  }
};

export default {
  logLogin,
  logSignUp,
  logScreenView,
  logPlantAdded,
  logPlantDeleted,
  logPlantAnalyzed,
  logPlantWatered,
  logChatStarted,
  logChatMessageSent,
  logEducationModuleViewed,
  logAchievementUnlocked,
  logCustomEvent,
  setUserProperties,
  setUserId,
};
