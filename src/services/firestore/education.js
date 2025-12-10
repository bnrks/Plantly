import { db } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs, getDoc, serverTimestamp } from "firebase/firestore";

export async function fetchEducationModules(setModules, setLoading) {
  try {
    setLoading?.(true);
    const snapshot = await getDocs(collection(db, "modules"));
    const modules = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        moduleName: data.module_name ?? "",
        content: data.content ?? null,
        bannerLink: data.banner_link ?? "",
      };
    });
    setModules?.(modules);
    return modules;
  } catch (error) {
    console.error("Egitim modulleri cekilirken hata olustu:", error);
    setModules?.([]);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

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
      content: data.content ?? null,
      bannerLink: data.banner_link ?? "",
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  } catch (error) {
    console.error("Modul cekilirken hata olustu:", error);
    throw error;
  }
}

export async function markEducationModuleCompleted(userId, moduleId, moduleName = "") {
  if (!userId || !moduleId) return false;
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, { uid: userId, createdAt: serverTimestamp() }, { merge: true });
    }
    const cmRef = doc(collection(db, "users", userId, "completedModules"), moduleId);
    await setDoc(cmRef, { moduleId, name: moduleName, completedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (e) {
    console.error("markEducationModuleCompleted hata:", e);
    return false;
  }
}

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

export async function syncCompletedModulesCounter(userId) {
  try {
    if (!userId) return 0;
    const count = await fetchCompletedModulesCount(userId);
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { completedModulesCount: count, updatedAt: serverTimestamp() }, { merge: true });
    return count;
  } catch (error) {
    console.error("completedModulesCount senkronizasyon hatasi:", error);
    return 0;
  }
}
