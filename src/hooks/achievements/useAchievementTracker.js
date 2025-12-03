// src/hooks/achievements/useAchievementTracker.js
import { useState, useCallback } from "react";
import {
  updatePlantWatering,
  incrementUserCounter,
  checkAllAchievementsForAction,
  fetchBadges,
} from "../../services/firestoreService";

/**
 * Achievement ve badge sistemini takip eden dinamik hook
 * Herhangi bir aksiyon için Firestore'daki TÜM ilgili achievement'ları kontrol eder
 * 
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Object} - trackAction, trackWatering, newBadges, clearNewBadges fonksiyonları
 */
export function useAchievementTracker(userId) {
  // Yeni kazanılan badge'ler (birden fazla olabilir)
  const [newBadges, setNewBadges] = useState([]);
  const [isTracking, setIsTracking] = useState(false);

  /**
   * Badge ID'lerini detaylı badge bilgilerine çevirir
   * @param {Array} awardedBadges - [{badgeId, achievementId}]
   * @returns {Promise<Array>} - Badge detayları ile zenginleştirilmiş array
   */
  const enrichBadgesWithDetails = useCallback(async (awardedBadges) => {
    if (!awardedBadges || awardedBadges.length === 0) return [];
    
    const allBadges = await fetchBadges();
    
    return awardedBadges.map(awarded => {
      const badgeDetails = allBadges.find(b => b.id === awarded.badgeId);
      return {
        ...awarded,
        name: badgeDetails?.name || awarded.badgeId,
        icon: badgeDetails?.icon,
        rarity: badgeDetails?.rarity,
      };
    });
  }, []);

  /**
   * Genel aksiyon takip fonksiyonu - Dinamik!
   * Firestore'dan actionType'a göre TÜM achievement'ları bulur ve kontrol eder
   * 
   * @param {string} actionType - Aksiyon tipi (watering, plant_added, analysis, module_completed)
   * @param {string} counterField - Artırılacak sayaç alanı (ör: wateringCount)
   * @param {Object} options - Ek seçenekler
   * @returns {Promise<{success: boolean, awardedBadges: Array}>}
   */
  const trackAction = useCallback(async (actionType, counterField, options = {}) => {
    if (!userId || isTracking) {
      return { success: false, awardedBadges: [] };
    }

    setIsTracking(true);
    
    try {
      // 1. Sayacı artır
      await incrementUserCounter(userId, counterField, options.incrementBy || 1);
      
      // 2. Bu actionType için TÜM achievement'ları kontrol et
      const result = await checkAllAchievementsForAction(userId, actionType);
      
      // 3. Kazanılan badge'ler varsa bildirim için hazırla
      if (result.awardedBadges && result.awardedBadges.length > 0) {
        const badgesWithDetails = await enrichBadgesWithDetails(result.awardedBadges);
        setNewBadges(badgesWithDetails);
        return { success: true, awardedBadges: badgesWithDetails };
      }
      
      return { success: true, awardedBadges: [] };
    } catch (error) {
      console.error(`${actionType} takibi sırasında hata:`, error);
      return { success: false, awardedBadges: [] };
    } finally {
      setIsTracking(false);
    }
  }, [userId, isTracking, enrichBadgesWithDetails]);

  /**
   * Sulama işlemini takip eder
   * Bitkinin lastWatered'ını günceller + genel sayacı artırır + achievement kontrol
   * @param {string} plantId - Sulanan bitki ID'si
   */
  const trackWatering = useCallback(async (plantId) => {
    if (!userId || !plantId || isTracking) {
      return { success: false, awardedBadges: [] };
    }

    setIsTracking(true);
    
    try {
      // 1. Bitkinin lastWatered ve wateringCount'unu güncelle
      await updatePlantWatering(userId, plantId);
      
      // 2. Kullanıcının toplam wateringCount'unu artır
      await incrementUserCounter(userId, "wateringCount", 1);
      
      // 3. "watering" actionType'ı için TÜM achievement'ları kontrol et
      const result = await checkAllAchievementsForAction(userId, "watering");
      
      // 4. Kazanılan badge'ler varsa bildirim için hazırla
      if (result.awardedBadges && result.awardedBadges.length > 0) {
        const badgesWithDetails = await enrichBadgesWithDetails(result.awardedBadges);
        setNewBadges(badgesWithDetails);
        return { success: true, awardedBadges: badgesWithDetails };
      }
      
      return { success: true, awardedBadges: [] };
    } catch (error) {
      console.error("Sulama takibi sırasında hata:", error);
      return { success: false, awardedBadges: [] };
    } finally {
      setIsTracking(false);
    }
  }, [userId, isTracking, enrichBadgesWithDetails]);

  /**
   * Bitki ekleme işlemini takip eder
   */
  const trackPlantAdded = useCallback(async () => {
    return trackAction("plant_added", "plantCount");
  }, [trackAction]);

  /**
   * Eğitim modülü tamamlama takibi
   */
  const trackModuleCompleted = useCallback(async () => {
    return trackAction("module_completed", "completedModulesCount");
  }, [trackAction]);

  /**
   * Analiz yapma takibi
   */
  const trackAnalysis = useCallback(async () => {
    return trackAction("analysis", "analysisCount");
  }, [trackAction]);

  /**
   * Yeni badge bildirimlerini temizler
   */
  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  // Geriye uyumluluk için tek badge döndür (ilk badge)
  const newBadge = newBadges.length > 0 ? newBadges[0] : null;
  const clearNewBadge = clearNewBadges;

  return {
    // Dinamik tracking
    trackAction,
    
    // Hazır tracking fonksiyonları
    trackWatering,
    trackPlantAdded,
    trackModuleCompleted,
    trackAnalysis,
    
    // Çoklu badge bildirimi
    newBadges,
    clearNewBadges,
    
    // Geriye uyumluluk (tek badge)
    newBadge,
    clearNewBadge,
    
    // Durum
    isTracking,
  };
}
