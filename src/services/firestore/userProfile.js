import { db, storage } from "../firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

export const createUserDocument = async (user, forceCreate = false) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && !forceCreate) {
    return { isNewUser: false, userData: userSnap.data() };
  }
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: "",
    name: "",
    createdAt: serverTimestamp(),
  });
  return { isNewUser: true, userData: null };
};

export const checkUserProfileComplete = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { exists: false, isComplete: false, missingFields: ["all"] };
    }
    const userData = userSnap.data();
    const missingFields = [];
    if (!userData.displayName || userData.displayName.trim() === "") {
      missingFields.push("displayName");
    }
    if (!userData.name || userData.name.trim() === "") {
      missingFields.push("name");
    }
    return {
      exists: true,
      isComplete: missingFields.length === 0,
      missingFields,
      userData,
    };
  } catch (error) {
    console.error("Profil kontrol hatası:", error);
    return { exists: false, isComplete: false, missingFields: ["all"] };
  }
};

export const updateUserName = async (userId, name) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { name });
};

export const updateUserDisplayName = async (userId, displayName) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { displayName });
};

export const deleteUserData = async (userId) => {
  try {
    const userDoc = doc(db, "users", userId);
    const plantsSnapshot = await getDocs(collection(db, "users", userId, "plants"));
    const deletePromises = plantsSnapshot.docs.map((plantDoc) =>
      deleteDoc(doc(db, "users", userId, "plants", plantDoc.id))
    );
    await Promise.all(deletePromises);
    await deleteDoc(userDoc);
    return { success: true };
  } catch (error) {
    console.error("Kullanıcı verileri silinirken hata:", error);
    throw error;
  }
};

export async function fetchUserProfileWithFavorite(userId) {
  if (!userId) {
    console.warn("Kullanici ID yok, profil bilgisi cekilemiyor.");
    return null;
  }
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const plantsSnap = await getDocs(collection(db, "users", userId, "plants"));
    let favoritePlant = null;
    let plantCount = plantsSnap.size || 0;

    plantsSnap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const wateringCount = typeof data.wateringCount === "number" ? data.wateringCount : 0;
      if (!favoritePlant || wateringCount > favoritePlant.wateringCount) {
        favoritePlant = {
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          wateringCount,
        };
      }
    });

    return {
      name: userData.name || "",
      displayName: userData.displayName || "",
      email: userData.email || "",
      createdAt: userData.createdAt || null,
      wateringStreak: userData.wateringStreak ?? 0,
      wateringScore: typeof userData.wateringScore === "number" ? userData.wateringScore : 0,
      favoritePlant,
      plantCount,
      completedModules: userData.completedModules ?? null,
      userPictureUrl: userData.profile_picture_url || userData.userPictureUrl || "",
    };
  } catch (error) {
    console.error("Kullanici profili cekilirken hata olustu:", error);
    throw error;
  }
}

export async function fetchUserPlantCount(userId) {
  if (!userId) {
    console.warn("Kullanici ID yok, bitki sayisi cekilemiyor.");
    return 0;
  }
  try {
    const plantsSnap = await getDocs(collection(db, "users", userId, "plants"));
    return plantsSnap.size || 0;
  } catch (error) {
    console.error("Bitki sayisi cekilirken hata olustu:", error);
    throw error;
  }
}

export async function fetchNotificationSettings(userId) {
  if (!userId) return null;
  const refDoc = doc(db, "users", userId, "settings", "notification_settings");
  const snap = await getDoc(refDoc);
  if (!snap.exists()) {
    return {
      wateringReminder: true,
      routineCare: true,
      diseaseAlert: true,
    };
  }
  const data = snap.data() || {};
  return {
    wateringReminder: typeof data.wateringReminder === "boolean" ? data.wateringReminder : true,
    routineCare: typeof data.routineCare === "boolean" ? data.routineCare : true,
    diseaseAlert: typeof data.diseaseAlert === "boolean" ? data.diseaseAlert : true,
  };
}

export async function updateNotificationSettings(userId, settings = {}) {
  if (!userId) {
    console.warn("notification_settings guncellenemedi: userId yok");
    return null;
  }
  const refDoc = doc(db, "users", userId, "settings", "notification_settings");
  const payload = {};
  if (typeof settings.wateringReminder === "boolean") payload.wateringReminder = settings.wateringReminder;
  if (typeof settings.routineCare === "boolean") payload.routineCare = settings.routineCare;
  if (typeof settings.diseaseAlert === "boolean") payload.diseaseAlert = settings.diseaseAlert;
  await setDoc(refDoc, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
  return payload;
}

export async function uploadProfilePicture(userId, fileUri) {
  if (!userId || !fileUri) {
    console.warn("Profil resmi yuklenemedi: userId veya fileUri eksik.");
    return null;
  }
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `users/profile_pictures/${userId}/profile.png`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", userId), {
      profile_picture_url: downloadUrl,
      userPictureUrl: downloadUrl,
      updatedAt: serverTimestamp(),
    });
    return downloadUrl;
  } catch (error) {
    console.error("Profil resmi yuklenirken hata olustu:", error);
    throw error;
  }
}
