export const API_URL = "https://2d4c-212-253-193-24.ngrok-free.app/predict";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
console.log("FETCH →", API_URL);
export async function pingServer() {
  const r = await fetch("http://e2f4-212-253-193-24.ngrok-free.app/docs");
  console.log("PING status", r.status);
}
export async function classifyImage(uri) {
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
