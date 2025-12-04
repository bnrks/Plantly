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
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { createUserDocument, checkUserProfileComplete, deleteUserData } from "./firestoreService";

// Lazy import for Google Sign-In (requires native module)
let GoogleSignin = null;
let statusCodes = null;

const getGoogleSignIn = async () => {
  if (!GoogleSignin) {
    const module = await import("@react-native-google-signin/google-signin");
    GoogleSignin = module.GoogleSignin;
    statusCodes = module.statusCodes;
    
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: "250730263332-m1mrrploaji5kbrus69hbo295cb3ehnh.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }
  return { GoogleSignin, statusCodes };
};

// Google Sign-In function
export const signInWithGoogle = async () => {
  try {
    const { GoogleSignin, statusCodes } = await getGoogleSignIn();
    
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    // Get the ID token
    const idToken = userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error("Google Sign-In failed: No ID token received");
    }
    
    // Create Firebase credential with Google ID token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase with credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    // Create user document in Firestore if it's a new user (won't override existing)
    const { isNewUser } = await createUserDocument(userCredential.user);
    
    // Check if profile is complete
    const profileStatus = await checkUserProfileComplete(userCredential.user.uid);
    
    return {
      userCredential,
      isNewUser,
      profileComplete: profileStatus.isComplete,
      missingFields: profileStatus.missingFields
    };
  } catch (error) {
    if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
      console.log("Google Sign-In cancelled by user");
      throw { code: "auth/cancelled", message: "Sign-in cancelled" };
    } else if (error.code === statusCodes?.IN_PROGRESS) {
      console.log("Google Sign-In already in progress");
      throw { code: "auth/in-progress", message: "Sign-in already in progress" };
    } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log("Play Services not available");
      throw { code: "auth/play-services-unavailable", message: "Google Play Services not available" };
    } else {
      console.error("Google Sign-In error:", error);
      throw error;
    }
  }
};

// Sign out from Google as well
export const signOutGoogle = async () => {
  try {
    const { GoogleSignin } = await getGoogleSignIn();
    await GoogleSignin.signOut();
  } catch (error) {
    console.log("Google sign out error:", error);
  }
};

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

export const logout = async () => {
  await signOutGoogle();
  return signOut(auth);
};
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
