// src/services/authService.js
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { createUserDocument } from "./firestoreService";

export const signup = async (email, password, username) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  await updateProfile(user, { displayName: username });
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
