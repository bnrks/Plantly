import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";

export async function incrementUserCounter(userId, counterField, incrementBy = 1) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { [counterField]: increment(incrementBy), updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error(`${counterField} artırılırken hata:`, error);
    throw error;
  }
}

export async function updateUserWateringStreak(userId) {
  try {
    if (!userId) return { updated: false };
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { updated: false };

    const data = userSnap.data() || {};
    const { lastWatered, wateringStreak = 0, lastStreakUpdate } = data;

    const toDate = (val) => {
      if (!val) return null;
      if (val?.toDate) return val.toDate();
      if (typeof val === "number") return new Date(val);
      if (val instanceof Date) return val;
      if (val?.seconds) return new Date(val.seconds * 1000);
      return null;
    };

    const lastWateredDate = toDate(lastWatered);
    const lastUpdateDate = toDate(lastStreakUpdate);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (lastUpdateDate && lastUpdateDate >= todayStart) return { updated: false };
    if (!lastWateredDate || lastWateredDate > now) return { updated: false };
    const crossedMidnight = lastWateredDate < todayStart;
    if (!crossedMidnight) return { updated: false };

    await updateDoc(userRef, {
      wateringStreak: (wateringStreak || 0) + 1,
      lastStreakUpdate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { updated: true, newStreak: (wateringStreak || 0) + 1 };
  } catch (error) {
    console.error("wateringStreak guncellenirken hata:", error);
    return { updated: false };
  }
}

export async function updateUserWateringScore(userId) {
  try {
    if (!userId) return { updated: false };
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { updated: false };

    const data = userSnap.data() || {};
    const wateringStreak = Number(data.wateringStreak || 0);
    const addScore = wateringStreak * 0.1 + 10;

    await updateDoc(userRef, { wateringScore: increment(addScore), updatedAt: serverTimestamp() });
    return { updated: true, added: addScore };
  } catch (error) {
    console.error("wateringScore guncellenirken hata:", error);
    return { updated: false };
  }
}
