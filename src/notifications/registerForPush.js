// src/notifications/registerForPush.js
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../services/firebaseConfig"; // senin firebase init yolun

export async function registerForPush(uid) {
  try {
    if (!Device.isDevice) return null;

    // Android notification channel (önemli)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // İzin iste
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    // EAS projectId -> Expo Push Token

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error("Expo Project ID bulunamadı!");
      console.error("Constants.expoConfig:", Constants?.expoConfig);
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Firestore'a kaydet (aynı token varsa arrayUnion tekrar eklemez)
    await setDoc(
      doc(db, "users", uid),
      {
        expoPushTokens: arrayUnion(token),
        timezone: "Europe/Istanbul", // istersen
      },
      { merge: true }
    );

    return token;
  } catch (e) {
    console.warn("registerForPush error:", e);
    return null;
  }
}
