import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

export async function uploadImageAsync(uri, path = "plants") {
  // uri: Expo ImagePicker’den gelen yerel dosya URI’si
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${path}/${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}
