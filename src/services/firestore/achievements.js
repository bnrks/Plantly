import { db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

export async function fetchAchievements() {
  try {
    const achievementsCol = collection(db, "achievements");
    const snapshot = await getDocs(achievementsCol);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Achievement'lar çekilirken hata:", error);
    return [];
  }
}

export async function fetchBadges() {
  try {
    const badgesCol = collection(db, "badges");
    const snapshot = await getDocs(badgesCol);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Badge'ler çekilirken hata:", error);
    return [];
  }
}

export async function fetchUserAchievementProgress(userId) {
  try {
    if (!userId) return [];
    const progressCol = collection(db, "users", userId, "achievementProgress");
    const snapshot = await getDocs(progressCol);
    return snapshot.docs.map((docSnap) => ({ achievementId: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Achievement progress çekilirken hata:", error);
    return [];
  }
}

export async function fetchUserBadges(userId) {
  try {
    if (!userId) return [];
    const badgesCol = collection(db, "users", userId, "badges");
    const snapshot = await getDocs(badgesCol);
    return snapshot.docs.map((docSnap) => ({ badgeId: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Kullanıcı badge'leri çekilirken hata:", error);
    return [];
  }
}

export async function updateAchievementProgress(userId, achievementId, newCurrent) {
  try {
    const progressRef = doc(db, "users", userId, "achievementProgress", achievementId);
    await setDoc(
      progressRef,
      {
        current: newCurrent,
        completed: false,
        completedAt: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Achievement progress güncellenirken hata:", error);
    throw error;
  }
}

export async function awardBadge(userId, badgeId, achievementId) {
  try {
    const badgeRef = doc(db, "users", userId, "badges", badgeId);
    await setDoc(badgeRef, {
      earnedAt: serverTimestamp(),
      achievementId,
    });
    return true;
  } catch (error) {
    console.error("Badge verilirken hata:", error);
    throw error;
  }
}

export async function checkAndAwardAchievement(userId, achievementId, counterField) {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const achievementRef = doc(db, "achievements", achievementId);
      const achievementDoc = await transaction.get(achievementRef);
      if (!achievementDoc.exists()) {
        console.warn(`Achievement bulunamadı: ${achievementId}`);
        return { completed: false, badgeAwarded: false, badgeId: null };
      }
      const achievement = achievementDoc.data();
      const { target, badgeId } = achievement;

      const userRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        return { completed: false, badgeAwarded: false, badgeId: null };
      }
      const userData = userDoc.data();
      const currentCount = userData[counterField] || 0;

      const progressRef = doc(db, "users", userId, "achievementProgress", achievementId);
      const progressDoc = await transaction.get(progressRef);
      const progressData = progressDoc.exists() ? progressDoc.data() : { completed: false };
      if (progressData.completed) {
        return { completed: true, badgeAwarded: false, badgeId: null };
      }

      transaction.set(
        progressRef,
        {
          current: currentCount,
          completed: currentCount >= target,
          completedAt: currentCount >= target ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (currentCount >= target) {
        const userBadgeRef = doc(db, "users", userId, "badges", badgeId);
        transaction.set(userBadgeRef, {
          earnedAt: serverTimestamp(),
          achievementId,
        });
        return { completed: true, badgeAwarded: true, badgeId };
      }

      return { completed: false, badgeAwarded: false, badgeId: null };
    });
    return result;
  } catch (error) {
    console.error("Achievement kontrolü sırasında hata:", error);
    return { completed: false, badgeAwarded: false, badgeId: null };
  }
}

export async function fetchAchievementsByActionType(actionType) {
  try {
    const achievementsCol = collection(db, "achievements");
    const snapshot = await getDocs(achievementsCol);
    return snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((achievement) => achievement.actionType === actionType);
  } catch (error) {
    console.error(`${actionType} achievement'ları çekilirken hata:`, error);
    return [];
  }
}

export async function checkAllAchievementsForAction(userId, actionType) {
  try {
    const achievements = await fetchAchievementsByActionType(actionType);
    if (achievements.length === 0) {
      return { success: true, awardedBadges: [] };
    }
    const awardedBadges = [];
    for (const achievement of achievements) {
      const result = await checkAndAwardAchievement(userId, achievement.id, achievement.progressField);
      if (result.badgeAwarded && result.badgeId) {
        awardedBadges.push({
          badgeId: result.badgeId,
          achievementId: achievement.id,
          achievementName: achievement.name,
        });
      }
    }
    return { success: true, awardedBadges };
  } catch (error) {
    console.error(`${actionType} achievement kontrolü sırasında hata:`, error);
    return { success: false, awardedBadges: [] };
  }
}
