import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { updateThreadTitle } from "./firestore";
import { handleWebSocketError } from "./chat/webSocketErrorHandler";
import { globalErrorHandler } from "./logging/globalErrorHandler";
import { db } from "./firebaseConfig";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.threadId = null;
    this.connectionListeners = [];
    this.messageListeners = [];
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 saniye

    this._resolvedWebSocketUrl = null;
    this._manualClose = false;
  }

  async resolveApiUrl() {
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

  buildWebSocketUrl(apiUrl) {
    const trimmed = (apiUrl || "").trim();
    if (!trimmed) {
      throw new Error("Geçersiz api_url");
    }

    // api_url http(s) ise ws(s) yap
    let normalized = trimmed;
    if (normalized.startsWith("http://")) {
      normalized = `ws://${normalized.slice("http://".length)}`;
    } else if (normalized.startsWith("https://")) {
      normalized = `wss://${normalized.slice("https://".length)}`;
    } else if (!normalized.startsWith("ws://") && !normalized.startsWith("wss://")) {
      // Şema yoksa https varsay
      normalized = `wss://${normalized}`;
    }

    // /ws/chat ekle (zaten varsa dokunma)
    try {
      const url = new URL(normalized);
      const path = url.pathname || "/";
      if (!path.endsWith("/ws/chat")) {
        const basePath = path.endsWith("/") ? path.slice(0, -1) : path;
        url.pathname = `${basePath}/ws/chat`;
      }
      return url.toString();
    } catch {
      // URL parse edilemezse en basit birleştirme
      const base = normalized.endsWith("/")
        ? normalized.slice(0, -1)
        : normalized;
      return base.endsWith("/ws/chat") ? base : `${base}/ws/chat`;
    }
  }

  async resolveWebSocketUrl() {
    // Her bağlanmadan önce Firestore'dan oku (dinamik olsun)
    const apiUrl = await this.resolveApiUrl();
    const wsUrl = this.buildWebSocketUrl(apiUrl);
    this._resolvedWebSocketUrl = wsUrl;
    return wsUrl;
  }

  // Heartbeat mekanizması - Devre dışı
  startHeartbeat() {
    // Heartbeat devre dışı bırakıldı - gereksiz bağlantı açılıp kapanmasını önlemek için
    console.log("💓 Heartbeat devre dışı");
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Otomatik yeniden bağlanma - Devre dışı
  async autoReconnect() {
    console.log("🔄 Otomatik reconnect devre dışı - manuel reconnect gerekli");
    this.notifyConnectionListeners("disconnected", "Bağlantı kesildi");
  }

  // Bağlantı durumu değişikliklerini dinlemek için
  addConnectionListener(callback) {
    this.connectionListeners.push(callback);
  }

  removeConnectionListener(callback) {
    this.connectionListeners = this.connectionListeners.filter(
      (listener) => listener !== callback
    );
  }

  // Mesaj dinleyicileri için
  addMessageListener(callback) {
    this.messageListeners.push(callback);
  }

  removeMessageListener(callback) {
    this.messageListeners = this.messageListeners.filter(
      (listener) => listener !== callback
    );
  }

  // Bağlantı durumu değişikliklerini bildir
  notifyConnectionListeners(status, message = "") {
    console.log("📢 Notifying connection listeners:", {
      status,
      message,
      listenersCount: this.connectionListeners.length,
    });
    this.connectionListeners.forEach((callback) => {
      callback(status, message);
    });
  }

  // Mesajları bildir
  notifyMessageListeners(message) {
    this.messageListeners.forEach((callback) => {
      callback(message);
    });
  }

  async connect(existingThreadId = null) {
    if (this.isConnected || this.isConnecting) {
      console.log("WebSocket zaten bağlı veya bağlanıyor");
      return;
    }

    try {
      this.isConnecting = true;
      this.notifyConnectionListeners("connecting", "Bağlantı kuruluyor...");

      // Eğer mevcut thread ID varsa, onu kullan
      if (existingThreadId) {
        this.threadId = existingThreadId;
        console.log("🔄 Mevcut thread ile bağlanılıyor:", existingThreadId);
      }

      // WebSocket bağlantısını kur (thread başlatmadan)
      await this.connectWebSocket();
    } catch (error) {
      console.error("❌ WebSocket bağlantı hatası:", error);
      this.isConnecting = false;
      const errorMessage = error.message || JSON.stringify(error);
      this.notifyConnectionListeners("error", errorMessage);
    }
  }

  async connectWebSocket() {
    const wsUrl = await this.resolveWebSocketUrl();

    return new Promise((resolve, reject) => {
      try {
        // WebSocket bağlantısını kur
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = async () => {
          console.log("✅ WebSocket bağlantısı açıldı");
          console.log("🔗 WebSocket URL:", wsUrl);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0; // Reset retry counter
          this.notifyConnectionListeners("connected", "Bağlantı kuruldu");

          // Heartbeat kaldırıldı - gereksiz ping/pong trafiğini önlemek için

          // Sadece thread ID varsa init mesajı gönder
          if (this.threadId) {
            try {
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (!currentUser) {
                throw new Error("Kullanıcı bulunamadı");
              }

              const idToken = await currentUser.getIdToken();

              const initMessage = {
                type: "init",
                idToken: idToken,
                thread_id: this.threadId,
              };

              this.ws.send(JSON.stringify(initMessage));
              console.log(
                "🔄 Mevcut thread ile init gönderildi:",
                this.threadId
              );
            } catch (error) {
              console.error("❌ Init mesajı gönderme hatası:", error);
            }
          } else {
            console.log(
              "� Thread yok, bağlantı hazır. İlk mesajda thread oluşturulacak."
            );
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📥 WebSocket mesajı alındı:", data);

            if (data.type === "thread_ready") {
              this.threadId = data.thread_id;
              console.log("🎯 Thread hazır, ID:", this.threadId);
            }

            // Eğer mesajda title varsa ve thread_id varsa Firebase'e kaydet
            if (data.title && data.thread_id && data.type === "message") {
              this.updateFirebaseTitle(data.thread_id, data.title);
            }

            this.notifyMessageListeners(data);
          } catch (error) {
            console.error("❌ Mesaj parse hatası:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket hatası:", error);
          console.log("📊 Error details:", {
            type: typeof error,
            message: error.message,
            stack: error.stack,
            event: error,
          });

          this.isConnected = false;
          this.isConnecting = false;

          handleWebSocketError(error);
          globalErrorHandler?.(error);

          const errorMessage = error.message || JSON.stringify(error);
          this.notifyConnectionListeners("error", errorMessage);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("❌ WebSocket bağlantısı kapandı", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          const wasManualClose = this._manualClose;
          this._manualClose = false;

          this.isConnected = false;
          this.isConnecting = false;
          this.stopHeartbeat(); // Heartbeat'i durdur

          // Close event'i global handler'a raporla
          if (!wasManualClose && !event.wasClean) {
            globalErrorHandler?.(
              new Error(
                `WebSocket closed unexpectedly: ${
                  event.reason || "Unknown reason"
                }`
              )
            );
          }

          this.notifyConnectionListeners("disconnected", "Bağlantı kesildi");

          // Otomatik reconnect kaldırıldı - kullanıcı manuel olarak bağlansın
          console.log(
            "ℹ️ Otomatik reconnect devre dışı - manuel bağlantı gerekli"
          );
        };
      } catch (constructorError) {
        // WebSocket constructor'da oluşan hatalar
        console.error("❌ WebSocket constructor hatası:", constructorError);
        this.isConnected = false;
        this.isConnecting = false;

        globalErrorHandler?.(constructorError);

        const errorMessage =
          constructorError.message || JSON.stringify(constructorError);
        this.notifyConnectionListeners("error", errorMessage);
        reject(constructorError);
      }
    });
  }

  // İlk mesajda thread başlat
  async initializeThread() {
    if (!this.isConnected || this.threadId) {
      console.log("WebSocket bağlı değil veya thread zaten var");
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const idToken = await currentUser.getIdToken();

      const initMessage = {
        type: "init",
        idToken: idToken,
        new_thread: true,
        title: "Yeni Sohbet",
      };

      this.ws.send(JSON.stringify(initMessage));
      console.log("🆕 Yeni thread init mesajı gönderildi");
    } catch (error) {
      console.error("❌ Thread başlatma hatası:", error);
      throw error;
    }
  }

  disconnect({ resetThreadId = false } = {}) {
    this._manualClose = true;
    this.stopHeartbeat(); // Heartbeat'i durdur

    if (resetThreadId) {
      this.threadId = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0; // Reset retry counter
  }

  // Mesaj gönderme
  sendMessage(message) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket bağlı değil, mesaj gönderilemedi");
    }
  }

  // Kullanıcı mesajı gönder
  sendUserMessage(text) {
    const message = {
      type: "user_text",
      text: text,
    };

    console.log("📤 Kullanıcı mesajı gönderiliyor:", message);
    this.sendMessage(message);
  }

  // Firebase'e thread title'ını güncelle
  async updateFirebaseTitle(threadId, title) {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.warn("⚠️ Kullanıcı bulunamadı, title güncellenemiyor");
        return;
      }

      await updateThreadTitle(currentUser.uid, threadId, title);
      console.log("✅ Thread title Firebase'e kaydedildi:", title);
    } catch (error) {
      console.error("❌ Thread title güncelleme hatası:", error);
    }
  }

  getConnectionStatus() {
    if (this.isConnecting) return "connecting";
    if (this.isConnected) return "connected";
    return "disconnected";
  }
}

// Singleton instance
const wsService = new WebSocketService();
export default wsService;
