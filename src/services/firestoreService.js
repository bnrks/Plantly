// src/services/firestoreService.js
import { db } from "./firebaseConfig";
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

  // 2. Kullanıcının altındaki 'plants' koleksiyon referansını al
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
        const storageRef = firebase.storage().ref(plantData.imagePath);
        plantData.imageUrl = await storageRef.getDownloadURL();
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
  const plantRef = doc(db, "users", userId, "plants", plantId);

  // 2. deleteDoc ile dokümanı tamamen sil
  await deleteDoc(plantRef);
}
