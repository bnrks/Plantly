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
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

// Diğer Firebase işlevleri
export const createUserDocument = async (user) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    createdAt: new Date(),
  });
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
        content: data.content ?? "",
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
      displayName: userData.displayName || "",
      email: userData.email || "",
      wateringStreak: userData.wateringStreak ?? 0,
      favoritePlant,
      plantCount,
      completedModules: userData.completedModules ?? null,
      userPictureUrl: userData.userPictureUrl || "",
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

    const storageRef = ref(storage, `users/profile_pictures/${userId}/avatar.jpg`);
    await uploadBytes(storageRef, blob);

    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", userId), {
      userPictureUrl: downloadUrl,
      updatedAt: serverTimestamp(),
    });

    return downloadUrl;
  } catch (error) {
    console.error("Profil resmi yuklenirken hata olustu:", error);
    throw error;
  }
}
