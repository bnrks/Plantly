import { db, storage } from "../firebaseConfig";
import {
  doc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

export async function addPlant(userId, plantData) {
  const userDocRef = doc(db, "users", userId);
  const userPlantsCol = collection(userDocRef, "plants");
  await addDoc(userPlantsCol, {
    ...plantData,
    createdAt: new Date(),
  });
}

export async function fetchPlants(useruid, setPlants, setLoading) {
  try {
    setLoading(true);
    if (!useruid) {
      console.warn("Kullanıcı oturum açmamış, bitkiler yüklenemiyor.");
      setLoading(false);
      return;
    }
    const plantsCol = collection(db, "users", useruid, "plants");
    const snapshot = await getDocs(plantsCol);
    const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    setPlants(list);
  } catch (err) {
    console.error("Firestore veri çekme hatası:", err);
  } finally {
    setLoading(false);
  }
}

export async function fetchPlantById(useruid, plantId) {
  try {
    if (!useruid) {
      console.warn("Kullanıcı oturum açmamış, bitki detayları çekilemiyor.");
      return null;
    }
    const plantDocRef = doc(db, "users", useruid, "plants", plantId);
    const plantSnapshot = await getDoc(plantDocRef);
    if (plantSnapshot.exists()) {
      const plantData = { id: plantSnapshot.id, ...plantSnapshot.data() };
      if (plantData.imagePath) {
        const storageRef = ref(storage, plantData.imagePath);
        plantData.imageUrl = await getDownloadURL(storageRef);
      }
      return plantData;
    }
    console.warn("Belirtilen ID ile bitki bulunamadı:", plantId);
    return null;
  } catch (error) {
    console.error("Bitki detayları çekilirken hata oluştu:", error);
    return null;
  }
}

export async function updatePlant(userId, plantId, data) {
  const plantRef = doc(db, "users", userId, "plants", plantId);
  await updateDoc(plantRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deletePlant(userId, plantId) {
  const plantRef = doc(db, "users", userId, "plants", plantId);
  await deleteDoc(plantRef);
}

export async function updatePlantSuggestions(userId, plantId, suggestions) {
  try {
    const plantRef = doc(db, "users", userId, "plants", plantId);
    await updateDoc(plantRef, { suggestions, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Bitki önerileri güncellenirken hata oluştu:", error);
    throw error;
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
    const list = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((plant) => {
        if (!plant.lastWatered) return true;
        const lastWateredDate = plant.lastWatered.toDate?.() || new Date(plant.lastWatered);
        const diffHours = (now - lastWateredDate) / (1000 * 60 * 60);
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
  await updateDoc(plantRef, { disease, diseaseUpdatedAt: serverTimestamp() });
}
