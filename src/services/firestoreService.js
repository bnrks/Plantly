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
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { cancelScheduledNotificationAsync } from "expo-notifications";
import { getPlantNotifId, deletePlantNotifId } from "./notificationStorage";

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

  // 2. updateDoc ile sadece gönderdiğimiz alanları Firestore’da güncelliyoruz.
  //    Ayrıca bir "updatedAt" alanı ekleyip değişiklik zamanını kaydediyoruz.
  await updateDoc(plantRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
export async function deletePlant(userId, plantId) {
  // 1. Bitki dokümanına referans oluştur
  const notifId = await getPlantNotifId(plantId);
  const plantRef = doc(db, "users", userId, "plants", plantId);
  if (notifId) await cancelScheduledNotificationAsync(notifId);
  await deletePlantNotifId(plantId);
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
// import { setLogLevel } from "firebase/firestore";
// setLogLevel("debug"); // Geçici olarak ayrıntılı log açın

export async function updateUserToken(userId, token) {
  try {
    console.log("▶ userId:", userId);
    console.log("▶ token :", token);

    const userRef = doc(db, "users", userId);
    console.log("▶ userRef.path:", userRef.path);

    await updateDoc(userRef, {
      expoPushToken: token,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Token Firestore’a yazıldı");
  } catch (error) {
    console.error("🔥 Firestore write error:", error);
  }
}
export async function updatePlantWatering(userId, plantId) {
  const plantRef = doc(db, "users", userId, "plants", plantId);
  await updateDoc(plantRef, {
    lastWatered: new Date(), // Son sulama zamanı (timestamp olarak kaydediyoruz)
    updatedAt: serverTimestamp(), // Firestore'un kendi server zamanı
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
