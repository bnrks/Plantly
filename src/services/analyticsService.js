// src/services/analyticsService.js
import analytics from '@react-native-firebase/analytics';

/**
 * Firebase Analytics Service
 * Uygulama genelinde analytics event'lerini yönetir
 */

// Kullanıcı oturumu event'leri
export const logLogin = async (method = 'email') => {
  try {
    await analytics().logLogin({ method });
    console.log('📊 Analytics: Login logged', method);
  } catch (error) {
    console.error('Analytics logLogin error:', error);
  }
};

export const logSignUp = async (method = 'email') => {
  try {
    await analytics().logSignUp({ method });
    console.log('📊 Analytics: SignUp logged', method);
  } catch (error) {
    console.error('Analytics logSignUp error:', error);
  }
};

// Ekran görüntüleme
export const logScreenView = async (screenName, screenClass) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    console.log('📊 Analytics: Screen viewed', screenName);
  } catch (error) {
    console.error('Analytics logScreenView error:', error);
  }
};

// Bitki event'leri
export const logPlantAdded = async (plantData) => {
  try {
    await analytics().logEvent('plant_added', {
      plant_name: plantData.name || 'unknown',
      plant_species: plantData.species || 'unknown',
      has_image: !!plantData.imageUrl,
    });
    console.log('📊 Analytics: Plant added', plantData.name);
  } catch (error) {
    console.error('Analytics logPlantAdded error:', error);
  }
};

export const logPlantDeleted = async (plantId) => {
  try {
    await analytics().logEvent('plant_deleted', {
      plant_id: plantId,
    });
    console.log('📊 Analytics: Plant deleted', plantId);
  } catch (error) {
    console.error('Analytics logPlantDeleted error:', error);
  }
};

export const logPlantAnalyzed = async (plantData) => {
  try {
    await analytics().logEvent('plant_analyzed', {
      plant_name: plantData.name || 'unknown',
      disease_detected: plantData.disease || 'none',
    });
    console.log('📊 Analytics: Plant analyzed', plantData.name);
  } catch (error) {
    console.error('Analytics logPlantAnalyzed error:', error);
  }
};

// Chat event'leri
export const logChatStarted = async () => {
  try {
    await analytics().logEvent('chat_started');
    console.log('📊 Analytics: Chat started');
  } catch (error) {
    console.error('Analytics logChatStarted error:', error);
  }
};

export const logChatMessageSent = async (messageType = 'text') => {
  try {
    await analytics().logEvent('chat_message_sent', {
      message_type: messageType,
    });
  } catch (error) {
    console.error('Analytics logChatMessageSent error:', error);
  }
};

// Eğitim modülü event'leri
export const logEducationModuleViewed = async (moduleId, moduleName) => {
  try {
    await analytics().logEvent('education_module_viewed', {
      module_id: moduleId,
      module_name: moduleName || 'unknown',
    });
    console.log('📊 Analytics: Education module viewed', moduleName);
  } catch (error) {
    console.error('Analytics logEducationModuleViewed error:', error);
  }
};

// Başarı/rozet event'leri
export const logAchievementUnlocked = async (achievementData) => {
  try {
    await analytics().logUnlockAchievement({
      achievement_id: achievementData.id || 'unknown',
    });
    await analytics().logEvent('badge_earned', {
      badge_id: achievementData.id,
      badge_name: achievementData.name || 'unknown',
    });
    console.log('📊 Analytics: Achievement unlocked', achievementData.name);
  } catch (error) {
    console.error('Analytics logAchievementUnlocked error:', error);
  }
};

// Genel event
export const logCustomEvent = async (eventName, params = {}) => {
  try {
    await analytics().logEvent(eventName, params);
    console.log('📊 Analytics: Custom event', eventName, params);
  } catch (error) {
    console.error('Analytics logCustomEvent error:', error);
  }
};

// Kullanıcı özelliklerini ayarla
export const setUserProperties = async (properties) => {
  try {
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
    console.log('📊 Analytics: User properties set', properties);
  } catch (error) {
    console.error('Analytics setUserProperties error:', error);
  }
};

// Kullanıcı ID'sini ayarla
export const setUserId = async (userId) => {
  try {
    await analytics().setUserId(userId);
    console.log('📊 Analytics: User ID set', userId);
  } catch (error) {
    console.error('Analytics setUserId error:', error);
  }
};

// Analytics'i etkinleştir/devre dışı bırak
export const setAnalyticsCollectionEnabled = async (enabled) => {
  try {
    await analytics().setAnalyticsCollectionEnabled(enabled);
    console.log('📊 Analytics: Collection enabled', enabled);
  } catch (error) {
    console.error('Analytics setAnalyticsCollectionEnabled error:', error);
  }
};

export default {
  logLogin,
  logSignUp,
  logScreenView,
  logPlantAdded,
  logPlantDeleted,
  logPlantAnalyzed,
  logChatStarted,
  logChatMessageSent,
  logEducationModuleViewed,
  logAchievementUnlocked,
  logCustomEvent,
  setUserProperties,
  setUserId,
  setAnalyticsCollectionEnabled,
};
