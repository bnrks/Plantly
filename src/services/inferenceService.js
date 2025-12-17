import * as FileSystem from "expo-file-system";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

async function resolveApiUrlFromFirestore() {
  const settingsRef = doc(db, "settings", "api_settings");
  const snap = await getDoc(settingsRef);
  const apiUrl = snap.exists() ? snap.data()?.api_url : null;

  if (!apiUrl || typeof apiUrl !== "string") {
    throw new Error(
      "Firestore settings/api_settings içinde geçerli api_url bulunamadı"
    );
  }

  return apiUrl.trim();
}

function normalizeHttpBaseUrl(apiUrl) {
  const trimmed = (apiUrl || "").trim();
  if (!trimmed) throw new Error("Geçersiz api_url");

  // ws(s) -> http(s)
  let normalized = trimmed;
  if (normalized.startsWith("ws://")) {
    normalized = `http://${normalized.slice("ws://".length)}`;
  } else if (normalized.startsWith("wss://")) {
    normalized = `https://${normalized.slice("wss://".length)}`;
  } else if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Eğer yanlışlıkla ws endpoint'i girildiyse (/ws/chat), base'e geri dön
  try {
    const url = new URL(normalized);
    let pathname = url.pathname || "/";
    if (pathname.endsWith("/ws/chat")) {
      pathname = pathname.slice(0, -"/ws/chat".length) || "/";
    }

    const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const baseUrl = `${url.origin}${basePath}`;
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  } catch {
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  }
}

function buildHttpUrl(baseUrl, path) {
  const base = (baseUrl || "").endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function pingTEST(pingUrl) {
  return fetch(pingUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export async function classifyImage(uri) {
  const apiUrl = await resolveApiUrlFromFirestore();
  const httpBaseUrl = normalizeHttpBaseUrl(apiUrl);
  const pingUrl = buildHttpUrl(httpBaseUrl, "/ping");
  const predictUrl = buildHttpUrl(httpBaseUrl, "/predict");

  const pingResponse = await pingTEST(pingUrl);
  if (!pingResponse.ok) {
    throw new Error("Sunucuya bağlanılamadı");
  }
  const res = await FileSystem.uploadAsync(predictUrl, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    headers: { Accept: "application/json" },
  });
  console.log("UPLOAD status", res.status);
  if (res.status !== 200) throw new Error(`Sunucu hatası ${res.status}`);
  return JSON.parse(res.body);
}
