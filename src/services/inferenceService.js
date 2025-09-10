export const API_URL =
  "https://learning-partially-rabbit.ngrok-free.app/predict"; // You should change this to your actual backend URL
const ping = "https://learning-partially-rabbit.ngrok-free.app/ping"; // You should change this to your actual backend URL
import * as FileSystem from "expo-file-system";
console.log("FETCH →", API_URL);

function pingTEST() {
  return fetch(ping, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export async function classifyImage(uri) {
  const pingResponse = await pingTEST();
  if (!pingResponse.ok) {
    throw new Error("Sunucuya bağlanılamadı");
  }
  const res = await FileSystem.uploadAsync(API_URL, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    headers: { Accept: "application/json" },
  });
  console.log("UPLOAD status", res.status);
  if (res.status !== 200) throw new Error(`Sunucu hatası ${res.status}`);
  return JSON.parse(res.body);
}
