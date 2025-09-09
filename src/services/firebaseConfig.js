// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    Constants?.expoConfig?.extra?.firebase?.apiKey ||
    "AIzaSyBC4KJsYshPdihaFZNvieGZ_jCOLtNNsck",
  authDomain:
    Constants?.expoConfig?.extra?.firebase?.authDomain ||
    "plantly-fae5e.firebaseapp.com",
  projectId:
    Constants?.expoConfig?.extra?.firebase?.projectId || "plantly-fae5e",
  storageBucket:
    Constants?.expoConfig?.extra?.firebase?.storageBucket ||
    "plantly-fae5e.firebasestorage.app",
  messagingSenderId:
    Constants?.expoConfig?.extra?.firebase?.messagingSenderId || "250730263332",
  appId:
    Constants?.expoConfig?.extra?.firebase?.appId ||
    "1:250730263332:web:8951fd8ef2863b380539b1",
  measurementId:
    Constants?.expoConfig?.extra?.firebase?.measurementId || "G-SGE1ETE4HF",
};

// Debug logging
console.log("🔥 Firebase Config:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services with persistence
let auth;
try {
  // İlk kez initialize etmeye çalış
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Eğer zaten initialize edilmişse, mevcut instance'ı al
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
    console.log(
      "Firebase Auth zaten initialize edilmiş, mevcut instance kullanılıyor"
    );
  } else {
    throw error;
  }
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
