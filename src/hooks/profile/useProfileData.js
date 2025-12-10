import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../services/firebaseConfig";
import {
  fetchUserProfileWithFavorite,
  fetchUserBadges,
  fetchBadges,
  fetchAchievements,
  fetchUserAchievementProgress,
  fetchCompletedModulesCount,
  syncCompletedModulesCounter,
  checkAllAchievementsForAction,
} from "../../services/firestoreService";

// iconPath cozer: https ise direkt, gs:// ise bucket host fix + getDownloadURL
const resolveIconUrl = async (path, label) => {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let fixedPath = path;
  if (fixedPath.startsWith("gs://") && fixedPath.includes(".firebasestorage.app")) {
    fixedPath = fixedPath.replace(".firebasestorage.app", ".appspot.com");
  }

  try {
    const url = await getDownloadURL(ref(storage, fixedPath));
    return url;
  } catch (err) {
    console.warn("iconPath cozumlenemedi", { label, path: fixedPath, err: err?.message });
    return null;
  }
};

export function useProfileData(userId) {
  const [profile, setProfile] = useState({
    name: "",
    displayName: "",
    createdAt: null,
    wateringStreak: 0,
    plantCount: null,
    favoritePlant: null,
    completedModules: null,
    userPictureUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementProgress, setAchievementProgress] = useState([]);
  const [badgeIconUrls, setBadgeIconUrls] = useState({});
  const [achievementIconUrls, setAchievementIconUrls] = useState({});

  // Temel profil verilerini çek
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [profileData, badgesData, allBadgesData, achievementsData, progressData, completedModulesCount] = await Promise.all([
          fetchUserProfileWithFavorite(userId),
          fetchUserBadges(userId),
          fetchBadges(),
          fetchAchievements(),
          fetchUserAchievementProgress(userId),
          fetchCompletedModulesCount(userId),
        ]);

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            ...profileData,
            completedModules: typeof completedModulesCount === "number" ? completedModulesCount : 0,
            completedModulesCount: typeof completedModulesCount === "number" ? completedModulesCount : 0,
          }));
        }

        setUserBadges(badgesData || []);
        setAllBadges(allBadgesData || []);
        setAchievements(achievementsData || []);
        setAchievementProgress(progressData || []);
      } catch (error) {
        console.error("Profil bilgisi cekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  // Ödül senkronizasyonu ve olası güncellemeleri arka planda çalıştır (UI'ı bloklamadan)
  useEffect(() => {
    if (!userId) return;

    const runBackgroundSync = async () => {
      try {
        await syncCompletedModulesCounter(userId);
        await checkAllAchievementsForAction(userId, "module_completed");

        const [updatedBadges, updatedProgress] = await Promise.all([
          fetchUserBadges(userId),
          fetchUserAchievementProgress(userId),
        ]);
        setUserBadges(updatedBadges || []);
        setAchievementProgress(updatedProgress || []);
      } catch (err) {
        console.warn("Arka plan senkronizasyonu hatasi", err?.message);
      }
    };

    runBackgroundSync();
  }, [userId]);

  // Storage iconPath -> URL çözümleme işlemlerini arka planda yap; UI'yı bekletme
  useEffect(() => {
    const loadBadgeIcons = async () => {
      const badgeUrlEntries = await Promise.all(
        (allBadges || []).map(async (b) => {
          const u = await resolveIconUrl(b.iconPath, `badge:${b.id}`);
          return [b.id, u];
        })
      );
      setBadgeIconUrls(Object.fromEntries(badgeUrlEntries));
    };

    const loadAchievementIcons = async () => {
      const achievementUrlEntries = await Promise.all(
        (achievements || []).map(async (a) => {
          const u = await resolveIconUrl(a.iconPath, `achievement:${a.id}`);
          return [a.id, u];
        })
      );
      setAchievementIconUrls(Object.fromEntries(achievementUrlEntries));
    };

    loadBadgeIcons();
    loadAchievementIcons();
  }, [allBadges, achievements]);

  return {
    profile,
    setProfile,
    loading,
    userBadges,
    allBadges,
    achievements,
    achievementProgress,
    badgeIconUrls,
    achievementIconUrls,
  };
}

export const profileResolvers = {
  resolveIconUrl,
};
