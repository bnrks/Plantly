import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "PLANT_NOTIF_MAP";

/** Bildirim ID’sini kaydet  { plantId: notifId } */
export async function savePlantNotifId(plantId, notifId) {
  const raw = await AsyncStorage.getItem(KEY);
  const map = raw ? JSON.parse(raw) : {};
  map[plantId] = notifId;
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

/** Bitkiye ait bildirimin ID’sini getir */
export async function getPlantNotifId(plantId) {
  const raw = await AsyncStorage.getItem(KEY);
  const map = raw ? JSON.parse(raw) : {};
  return map[plantId];
}

/** Bitki silindiğinde kaydı temizle */
export async function deletePlantNotifId(plantId) {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return;
  const map = JSON.parse(raw);
  delete map[plantId];
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
