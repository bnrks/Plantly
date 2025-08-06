import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { savePlantNotifId } from "./notificationStorage";
export async function registerForPushNotificationsAsync() {
  console.log("▶️ 1. Başladı registerForPushNotificationsAsync");

  try {
    // console.log("▶️ 2. Device.isDevice:", Device.isDevice);
    if (!Device.isDevice) {
      console.warn("❌ Emulator veya simülatör: gerçek cihaz gereklidir.");
      alert("Gerçek bir cihaz kullanmanız gerekiyor!");
      return;
    }

    // console.log("▶️ 3. İzinleri kontrol ediyorum...");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    // console.log("✅ Mevcut izin durumu:", existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      // console.log("▶️ 4. İzin isteniyor...");
      const { status } = await Notifications.requestPermissionsAsync();
      // console.log("✅ İstek sonrası durum:", status);
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("❌ Kullanıcı izin vermedi, çıkılıyor.");
      alert("Bildirim izni verilmedi!");
      return;
    }

    // console.log("▶️ 5. Push token alınıyor...");
    const tokenData = await Notifications.getExpoPushTokenAsync();
    // console.log("📦 Raw tokenData objesi:", tokenData);
    const token = tokenData.data;
    console.log("🎉 Expo Push Token:", token);

    // Android için kanal ayarı
    if (Platform.OS === "android") {
      // console.log("▶️ 6. Android kanal ayarlanıyor...");
      await Notifications.setNotificationChannelAsync("watering-channel", {
        name: "Sulama Hatırlatıcıları",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#32CD32",
      });
      // console.log("✅ Kanal oluşturuldu.");
    }

    return token;
  } catch (error) {
    console.error("🚨 registerForPushNotificationsAsync hatası:", error);
  }
}
export async function scheduleWateringNotificationRepeating(plant) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌿 ${plant.name}’i Sulama Zamanı!`,
      body: `${plant.name} susadı, sulamayı unutma.`,
      data: { plantId: plant.id, plantName: plant.name },
      sound: true,
    },
    trigger: { seconds: 60, repeats: true }, // 24 saat
  });

  // Bildirim ID’sini bitkinin altında sakla (Firestore veya AsyncStorage)
  await savePlantNotifId(plant.id, id);
}
export async function planDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync(); // temizlik
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌿 Sulama Zamanı!",
      body: "Bitkini sulamayı unutma.",
      sound: true,
    },
    trigger: { hour: 10, minute: 0, repeats: true }, // her sabah 10:00
  });
}
