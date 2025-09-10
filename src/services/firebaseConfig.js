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
    Constants?.expoConfig?.extra?.firebase?.apiKey,
  authDomain:
    Constants?.expoConfig?.extra?.firebase?.authDomain,
  projectId:
    Constants?.expoConfig?.extra?.firebase?.projectId,
  storageBucket:
    Constants?.expoConfig?.extra?.firebase?.storageBucket,
  messagingSenderId:
    Constants?.expoConfig?.extra?.firebase?.messagingSenderId,
  appId:
    Constants?.expoConfig?.extra?.firebase?.appId,
  measurementId:
    Constants?.expoConfig?.extra?.firebase?.measurementId,
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
