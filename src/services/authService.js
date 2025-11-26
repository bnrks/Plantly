// src/services/authService.js
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { createUserDocument, deleteUserData } from "./firestoreService";

export const signup = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  await createUserDocument(user);
  return userCredential;
};

export const signin = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);

    return { success: true };
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);
    return { success: false, code: error.code };
  }
}
export const observeAuth = (callback) => onAuthStateChanged(auth, callback);

// Kullanıcı hesabını tamamen sil (Firestore verileri + Auth)
export const deleteUserAccount = async (userId) => {
  try {
    // Önce Firestore'daki kullanıcı verilerini sil
    await deleteUserData(userId);
    
    // Sonra Firebase Auth'dan kullanıcıyı sil
    const currentUser = auth.currentUser;
    if (currentUser) {
      await deleteUser(currentUser);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Hesap silme hatası:", error);
    throw error;
  }
};
