// src/services/firestoreService.js
import { db, storage } from "./firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

// Diğer Firebase işlevleri
// Kullanıcı dokümanı oluştur - sadece yeni kullanıcı için
export const createUserDocument = async (user, forceCreate = false) => {
  const userRef = doc(db, "users", user.uid);
  
  // Mevcut kullanıcıyı kontrol et
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists() && !forceCreate) {
    // Kullanıcı zaten var, mevcut verileri koru
    console.log("Kullanıcı zaten mevcut, veriler korunuyor");
    return { isNewUser: false, userData: userSnap.data() };
  }
  
  // Yeni kullanıcı oluştur
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: "",
    name: "",
    createdAt: serverTimestamp(),
  });
  
  return { isNewUser: true, userData: null };
};

// Kullanıcı profilinin tamamlanıp tamamlanmadığını kontrol et
export const checkUserProfileComplete = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { exists: false, isComplete: false, missingFields: ['all'] };
    }
    
    const userData = userSnap.data();
    const missingFields = [];
    
    if (!userData.displayName || userData.displayName.trim() === '') {
      missingFields.push('displayName');
    }
    if (!userData.name || userData.name.trim() === '') {
      missingFields.push('name');
    }
    
    return {
      exists: true,
      isComplete: missingFields.length === 0,
      missingFields,
      userData
    };
  } catch (error) {
    console.error("Profil kontrol hatası:", error);
    return { exists: false, isComplete: false, missingFields: ['all'] };
  }
};

// Kullanıcı adını güncelle
export const updateUserName = async (userId, name) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    name: name,
  });
};

// Kullanıcı displayName'i güncelle
export const updateUserDisplayName = async (userId, displayName) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    displayName: displayName,
  });
};

// Kullanıcının tüm verilerini sil (plants alt koleksiyonu dahil)
export const deleteUserData = async (userId) => {
  try {
    // Önce kullanıcının plants alt koleksiyonunu sil
    const plantsCol = collection(db, "users", userId, "plants");
    const plantsSnapshot = await getDocs(plantsCol);
    
    const deletePromises = plantsSnapshot.docs.map((plantDoc) => 
      deleteDoc(doc(db, "users", userId, "plants", plantDoc.id))
    );
    await Promise.all(deletePromises);
    
    // Sonra kullanıcı dokümanını sil
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    
    return { success: true };
  } catch (error) {
    console.error("Kullanıcı verileri silinirken hata:", error);
    throw error;
  }
};

export async function addPlant(userId, plantData) {
  // plantData = { name, species, description, imageUrl }

  // 1. Kullanıcının belge referansını al
  // 'users' koleksiyonunda, 'userId' ID'sine sahip belgeye referans oluşturur.
  const userDocRef = doc(db, "users", userId);

  // 2. Kullanıcının altındaki 'plants' koleksiyonu referansını al
  // userDocRef'in altında bir 'plants' alt-koleksiyonu oluşturur.
  const userPlantsCol = collection(userDocRef, "plants");

  // 3. Bitki verisini bu alt-koleksiyona ekle
  await addDoc(userPlantsCol, {
    // 'owner: userId' artık gerekli değil çünkü 'userId' zaten yolun içinde
    ...plantData,
    createdAt: new Date(),
  });
}

export async function fetchPlants(useruid, setPlants, setLoading) {
  try {
    setLoading(true); // Veri yüklenirken loading durumunu ayarlayın
    if (!useruid) {
      console.warn("Kullanıcı oturum açmamış, bitkiler yüklenemiyor.");
      setLoading(false);
      return; // Oturum açmamışsa işlemi durdur
    }

    const plantsCol = collection(db, "users", useruid, "plants"); // Kullanıcının altındaki 'plants' koleksiyonu
    const snapshot = await getDocs(plantsCol); // Koleksiyonu oku

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPlants(list);
  } catch (err) {
    console.error("Firestore veri çekme hatası:", err);
  } finally {
    setLoading(false); // Yükleme tamamlandığında loading'i kapatın
  }
}

export async function fetchPlantById(useruid, plantId) {
  try {
    if (!useruid) {
      console.warn("Kullanıcı oturum açmamış, bitki detayları çekilemiyor.");
      return null; // Oturum açmamışsa null dön
    }

    // users/{userId}/plants/{plantId} yoluna referans oluştur
    const plantDocRef = doc(db, "users", useruid, "plants", plantId);

    const plantSnapshot = await getDoc(plantDocRef);

    if (plantSnapshot.exists()) {
      // Doküman varsa verilerini dön
      const plantData = { id: plantSnapshot.id, ...plantSnapshot.data() };
      // Eğer imageUrl yerine imagePath kaydettiyseniz, burada download URL'sini de alın
      if (plantData.imagePath) {
        const storageRef = ref(storage, plantData.imagePath);
        plantData.imageUrl = await getDownloadURL(storageRef);
      }
      return plantData;
    } else {
      // Doküman yoksa
      console.warn("Belirtilen ID ile bitki bulunamadı:", plantId);
      return null;
    }
  } catch (error) {
    console.error("Bitki detayları çekilirken hata oluştu:", error);
    return null;
  }
}

export async function updatePlant(userId, plantId, data) {
  // 1. Bitki dokümanına bir referans oluşturuyoruz
  const plantRef = doc(db, "users", userId, "plants", plantId);

  // 2. updateDoc ile sadece gönderdiğimiz alanları Firestore'da güncelliyoruz.
  //    Ayrıca bir "updatedAt" alanı ekleyip değişiklik zamanını kaydediyoruz.
  await updateDoc(plantRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlant(userId, plantId) {
  // 1. Bitki dokümanına referans oluştur
  const plantRef = doc(db, "users", userId, "plants", plantId);

  // 2. deleteDoc ile dokümanı tamamen sil
  await deleteDoc(plantRef);
}

export async function updatePlantSuggestions(userId, plantId, suggestions) {
  try {
    // Bitki dokümanına referans oluştur
    const plantRef = doc(db, "users", userId, "plants", plantId);
    console.log("Bitki referansı:", plantRef);
    // Sadece suggestions alanını ve güncellenme zamanını güncelle
    await updateDoc(plantRef, {
      suggestions: suggestions,
      updatedAt: serverTimestamp(),
    });

    console.log(`${plantId} ID'li bitkinin önerileri güncellendi.`);
    return true;
  } catch (error) {
    console.error("Bitki önerileri güncellenirken hata oluştu:", error);
    throw error; // Hatayı çağıran fonksiyona ilet
  }
}

export async function updatePlantWatering(userId, plantId) {
  const plantRef = doc(db, "users", userId, "plants", plantId);
  await updateDoc(plantRef, {
    lastWatered: new Date(),
    updatedAt: serverTimestamp(),
    wateringCount: increment(1),
  });
}

export async function fetchPlantsForWatering(useruid, setPlants, setLoading) {
  try {
    setLoading(true);
    if (!useruid) {
      console.warn("Kullanıcı oturum açmamış, bitkiler yüklenemiyor.");
      setLoading(false);
      return;
    }
    const plantsCol = collection(db, "users", useruid, "plants");
    const snapshot = await getDocs(plantsCol);

    const now = new Date();
    // Her bir bitkinin lastWatered'ını kontrol et
    const list = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((plant) => {
        // Eğer hiç sulanmamışsa (lastWatered yoksa) listeye ekle
        if (!plant.lastWatered) return true;
        // lastWatered Firestore'dan Timestamp objesi olarak gelir, onu Date'e çevir
        const lastWateredDate =
          plant.lastWatered.toDate?.() || new Date(plant.lastWatered);
        // Şimdiki zaman ile lastWatered arasındaki farkı saat cinsine çevir
        const diffMs = now - lastWateredDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= 20;
      });
    setPlants(list);
  } catch (err) {
    console.error("Firestore veri çekme hatası:", err);
  } finally {
    setLoading(false);
  }
}

export async function updatePlantDisease(userId, plantId, disease) {
  const plantRef = doc(db, "users", userId, "plants", plantId);
  await updateDoc(plantRef, {
    disease: disease,
    diseaseUpdatedAt: serverTimestamp(),
  });
}

// Thread silme fonksiyonu
export async function deleteThread(userId, threadId) {
  try {
    const threadRef = doc(db, "users", userId, "threads", threadId);
    await deleteDoc(threadRef);
    console.log(`Thread silindi: ${threadId}`);
    return true;
  } catch (error) {
    console.error("Thread silme hatası:", error);
    throw error;
  }
}

// Thread title güncelleme fonksiyonu
export async function updateThreadTitle(userId, threadId, title) {
  try {
    const threadRef = doc(db, "users", userId, "threads", threadId);
    await updateDoc(threadRef, {
      title: title,
      titleUpdatedAt: serverTimestamp(),
    });
    console.log(`Thread title güncellendi: ${threadId} -> ${title}`);
    return true;
  } catch (error) {
    console.error("Thread title güncelleme hatası:", error);
    throw error;
  }
}


/**
 * Firestore'da modules koleksiyonundan egitim modullerini ceker.
 * setModules ve setLoading verilirse state'leri otomatik gunceller, ayrica modulleri dondurur.
 */
export async function fetchEducationModules(setModules, setLoading) {
  try {
    setLoading?.(true);

    const snapshot = await getDocs(collection(db, "modules"));
    const modules = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        moduleName: data.module_name ?? "",
        content: data.content ?? null, // TipTap JSON veya null
        bannerLink: data.banner_link ?? "",
      };
    });

    if (setModules) {
      setModules(modules);
    }

    return modules;
  } catch (error) {
    console.error("Egitim modulleri cekilirken hata olustu:", error);
    if (setModules) {
      setModules([]);
    }
    throw error;
  } finally {
    setLoading?.(false);
  }
}

/**
 * Firestore'dan tek bir egitim modulunu ID'ye gore ceker.
 * @param {string} moduleId - Modul document ID
 * @returns {Promise<Object|null>} Modul verisi veya null
 */
export async function fetchEducationModuleById(moduleId) {
  if (!moduleId) {
    console.warn("Modul ID belirtilmedi.");
    return null;
  }

  try {
    const docRef = doc(db, "modules", moduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`Modul bulunamadi: ${moduleId}`);
      return null;
    }

    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      moduleName: data.module_name ?? "",
      content: data.content ?? null, // TipTap JSON
      bannerLink: data.banner_link ?? "",
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  } catch (error) {
    console.error("Modul cekilirken hata olustu:", error);
    throw error;
  }
}

/**
 * Kullanıcı için tamamlanan eğitim modülünü işaretler
 * users/{userId}/completedModules/{moduleId}
 */
export async function markEducationModuleCompleted(userId, moduleId, moduleName = "") {
  if (!userId || !moduleId) return false;
  try {
    // Kullanıcı dokümanı yoksa oluştur (koleksiyon eklenebilmesi için ebeveyn garanti)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(
        userRef,
        { uid: userId, createdAt: serverTimestamp() },
        { merge: true }
      );
    }

    // Alt koleksiyon belgesini yaz (koleksiyon otomatik oluşur)
    const cmRef = doc(collection(db, "users", userId, "completedModules"), moduleId);
    await setDoc(
      cmRef,
      { moduleId, name: moduleName, completedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error("markEducationModuleCompleted hata:", e);
    return false;
  }
}

/**
 * Kullanici profil bilgilerini ve en cok sulanan favori bitkiyi dondurur.
 * favoritePlant: { id, name, description, imageUrl, wateringCount } veya null
 */
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
      const wateringCount =
        typeof data.wateringCount === "number" ? data.wateringCount : 0;

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
      favoritePlant,
      plantCount,
      completedModules: userData.completedModules ?? null,
      // Yeni alan profile_picture_url, eski alan userPictureUrl ile geriye donuk uyum
      userPictureUrl: userData.profile_picture_url || userData.userPictureUrl || "",
    };
  } catch (error) {
    console.error("Kullanici profili cekilirken hata olustu:", error);
    throw error;
  }
}

/**
 * Kullanicinin toplam bitki sayisini dondurur.
 */
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

/**
 * Kullanıcının tamamladığı eğitim modüllerinin ID listesini döndürür.
 */
export async function fetchCompletedModuleIds(userId) {
  if (!userId) return [];
  try {
    const snap = await getDocs(collection(db, "users", userId, "completedModules"));
    return snap.docs.map((d) => d.id);
  } catch (e) {
    console.error("Tamamlanan moduller cekilirken hata:", e);
    return [];
  }
}

/**
 * Kullanıcının tamamladığı eğitim modüllerinin sayısını döndürür.
 */
export async function fetchCompletedModulesCount(userId) {
  if (!userId) return 0;
  try {
    const snap = await getDocs(collection(db, "users", userId, "completedModules"));
    return snap.size || 0;
  } catch (e) {
    console.error("Tamamlanan modul sayisi cekilirken hata:", e);
    return 0;
  }
}

/**
 * users/{userId}/completedModules alt koleksiyonuna bakarak
 * users/{userId}.completedModulesCount alanını senkronize eder.
 * Achievement kontrolü bu sayaçtan beslendiği için tutarlılık sağlar.
 */
export async function syncCompletedModulesCounter(userId) {
  try {
    if (!userId) return 0;
    const count = await fetchCompletedModulesCount(userId);
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      { completedModulesCount: count, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return count;
  } catch (error) {
    console.error("completedModulesCount senkronizasyon hatasi:", error);
    return 0;
  }
}

/**
 * Bildirim ayarlarini oku (users/{userId}/settings/notification_settings)
 */
export async function fetchNotificationSettings(userId) {
  if (!userId) return null;

  const ref = doc(db, "users", userId, "settings", "notification_settings");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return {
      wateringReminder: true,
      routineCare: true,
      diseaseAlert: true,
    };
  }
  const data = snap.data() || {};
  return {
    wateringReminder:
      typeof data.wateringReminder === "boolean" ? data.wateringReminder : true,
    routineCare:
      typeof data.routineCare === "boolean" ? data.routineCare : true,
    diseaseAlert:
      typeof data.diseaseAlert === "boolean" ? data.diseaseAlert : true,
  };
}

/**
 * Bildirim ayarlarini guncelle (users/{userId}/settings/notification_settings)
 */
export async function updateNotificationSettings(userId, settings = {}) {
  if (!userId) {
    console.warn("notification_settings guncellenemedi: userId yok");
    return null;
  }
  const ref = doc(db, "users", userId, "settings", "notification_settings");

  const payload = {};
  if (typeof settings.wateringReminder === "boolean") {
    payload.wateringReminder = settings.wateringReminder;
  }
  if (typeof settings.routineCare === "boolean") {
    payload.routineCare = settings.routineCare;
  }
  if (typeof settings.diseaseAlert === "boolean") {
    payload.diseaseAlert = settings.diseaseAlert;
  }

  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return payload;
}

/**
 * Profil resmini Firebase Storage'a yukler, userPictureUrl olarak user dokumanina kaydeder ve download URL dondurur.
 * @param {string} userId
 * @param {string} fileUri - cihazdan secilen resim uri'si
 */
export async function uploadProfilePicture(userId, fileUri) {
  if (!userId || !fileUri) {
    console.warn("Profil resmi yuklenemedi: userId veya fileUri eksik.");
    return null;
  }

  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Belirtilen pathe yukle: users/profile_pictures/{userId}/profile.png
    const storageRef = ref(storage, `users/profile_pictures/${userId}/profile.png`);
    await uploadBytes(storageRef, blob);

    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", userId), {
      // Yeni alan (istenen): profile_picture_url. Eski alanla da uyumlu kalsin.
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

// ========== ACHIEVEMENT & BADGE SİSTEMİ ==========

/**
 * Tüm achievement tanımlarını Firestore'dan çeker
 * @returns {Promise<Array>} Achievement listesi
 */
export async function fetchAchievements() {
  try {
    const achievementsCol = collection(db, "achievements");
    const snapshot = await getDocs(achievementsCol);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Achievement'lar çekilirken hata:", error);
    return [];
  }
}

/**
 * Tüm badge tanımlarını Firestore'dan çeker
 * @returns {Promise<Array>} Badge listesi
 */
export async function fetchBadges() {
  try {
    const badgesCol = collection(db, "badges");
    const snapshot = await getDocs(badgesCol);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Badge'ler çekilirken hata:", error);
    return [];
  }
}

/**
 * Kullanıcının achievement progress'lerini çeker
 * @param {string} userId
 * @returns {Promise<Array>} Progress listesi
 */
export async function fetchUserAchievementProgress(userId) {
  try {
    if (!userId) return [];
    
    const progressCol = collection(db, "users", userId, "achievementProgress");
    const snapshot = await getDocs(progressCol);
    
    return snapshot.docs.map((doc) => ({
      achievementId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Achievement progress çekilirken hata:", error);
    return [];
  }
}

/**
 * Kullanıcının kazandığı badge'leri çeker
 * @param {string} userId
 * @returns {Promise<Array>} Kazanılan badge listesi
 */
export async function fetchUserBadges(userId) {
  try {
    if (!userId) return [];
    
    const badgesCol = collection(db, "users", userId, "badges");
    const snapshot = await getDocs(badgesCol);
    
    return snapshot.docs.map((doc) => ({
      badgeId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Kullanıcı badge'leri çekilirken hata:", error);
    return [];
  }
}

/**
 * Achievement progress'i günceller
 * @param {string} userId
 * @param {string} achievementId
 * @param {number} newCurrent - Yeni current değeri
 */
export async function updateAchievementProgress(userId, achievementId, newCurrent) {
  try {
    const progressRef = doc(db, "users", userId, "achievementProgress", achievementId);
    
    await setDoc(progressRef, {
      current: newCurrent,
      completed: false,
      completedAt: null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Achievement progress güncellenirken hata:", error);
    throw error;
  }
}

/**
 * Kullanıcıya badge verir
 * @param {string} userId
 * @param {string} badgeId
 * @param {string} achievementId - Hangi achievement'tan kazanıldı
 */
export async function awardBadge(userId, badgeId, achievementId) {
  try {
    const badgeRef = doc(db, "users", userId, "badges", badgeId);
    
    await setDoc(badgeRef, {
      earnedAt: serverTimestamp(),
      achievementId: achievementId,
    });
    
    return true;
  } catch (error) {
    console.error("Badge verilirken hata:", error);
    throw error;
  }
}

/**
 * Achievement kontrolü yapar ve tamamlandıysa badge verir
 * Transaction kullanarak race condition önler
 * @param {string} userId
 * @param {string} achievementId
 * @param {string} counterField - users/{userId} içindeki sayaç alanı (ör: wateringCount)
 * @returns {Promise<{completed: boolean, badgeAwarded: boolean, badgeId: string|null}>}
 */
export async function checkAndAwardAchievement(userId, achievementId, counterField) {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Achievement tanımını çek
      const achievementRef = doc(db, "achievements", achievementId);
      const achievementDoc = await transaction.get(achievementRef);
      
      if (!achievementDoc.exists()) {
        console.warn(`Achievement bulunamadı: ${achievementId}`);
        return { completed: false, badgeAwarded: false, badgeId: null };
      }
      
      const achievement = achievementDoc.data();
      const { target, badgeId } = achievement;
      
      // 2. Kullanıcının sayacını çek
      const userRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        return { completed: false, badgeAwarded: false, badgeId: null };
      }
      
      const userData = userDoc.data();
      const currentCount = userData[counterField] || 0;
      
      // 3. Progress dokümanını çek
      const progressRef = doc(db, "users", userId, "achievementProgress", achievementId);
      const progressDoc = await transaction.get(progressRef);
      
      const progressData = progressDoc.exists() ? progressDoc.data() : { completed: false };
      
      // Zaten tamamlanmışsa tekrar badge verme
      if (progressData.completed) {
        return { completed: true, badgeAwarded: false, badgeId: null };
      }
      
      // 4. Progress'i güncelle
      transaction.set(progressRef, {
        current: currentCount,
        completed: currentCount >= target,
        completedAt: currentCount >= target ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // 5. Hedef tamamlandıysa badge ver
      if (currentCount >= target) {
        const userBadgeRef = doc(db, "users", userId, "badges", badgeId);
        transaction.set(userBadgeRef, {
          earnedAt: serverTimestamp(),
          achievementId: achievementId,
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

/**
 * Kullanıcının belirli bir sayacını artırır
 * @param {string} userId
 * @param {string} counterField - Artırılacak alan adı (ör: wateringCount, plantCount)
 * @param {number} incrementBy - Artırma miktarı (varsayılan: 1)
 */
export async function incrementUserCounter(userId, counterField, incrementBy = 1) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [counterField]: increment(incrementBy),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error(`${counterField} artırılırken hata:`, error);
    throw error;
  }
}

/**
 * Belirli bir actionType'a sahip tüm achievement'ları çeker
 * @param {string} actionType - Aksiyon tipi (watering, plant_added, analysis, module_completed)
 * @returns {Promise<Array>} Achievement listesi
 */
export async function fetchAchievementsByActionType(actionType) {
  try {
    const achievementsCol = collection(db, "achievements");
    const snapshot = await getDocs(achievementsCol);
    
    // actionType'a göre filtrele
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((achievement) => achievement.actionType === actionType);
  } catch (error) {
    console.error(`${actionType} achievement'ları çekilirken hata:`, error);
    return [];
  }
}

/**
 * Belirli bir actionType için TÜM achievement'ları kontrol eder ve badge verir
 * @param {string} userId
 * @param {string} actionType - Aksiyon tipi (watering, plant_added, analysis, module_completed)
 * @returns {Promise<{success: boolean, awardedBadges: Array}>}
 */
export async function checkAllAchievementsForAction(userId, actionType) {
  try {
    // 1. Bu actionType'a ait tüm achievement'ları çek
    const achievements = await fetchAchievementsByActionType(actionType);
    
    if (achievements.length === 0) {
      return { success: true, awardedBadges: [] };
    }
    
    const awardedBadges = [];
    
    // 2. Her achievement için kontrol yap
    for (const achievement of achievements) {
      const result = await checkAndAwardAchievement(
        userId,
        achievement.id,
        achievement.progressField
      );
      
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
