import { db } from "../firebaseConfig";
import { doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function deleteThread(userId, threadId) {
  try {
    const threadRef = doc(db, "users", userId, "threads", threadId);
    await deleteDoc(threadRef);
    return true;
  } catch (error) {
    console.error("Thread silme hatası:", error);
    throw error;
  }
}

export async function updateThreadTitle(userId, threadId, title) {
  try {
    const threadRef = doc(db, "users", userId, "threads", threadId);
    await updateDoc(threadRef, { title, titleUpdatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Thread title güncelleme hatası:", error);
    throw error;
  }
}
