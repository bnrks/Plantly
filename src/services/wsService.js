import { getAuth } from "firebase/auth";
import { updateThreadTitle } from "./firestoreService";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.threadId = null;
    this.connectionListeners = [];
    this.messageListeners = [];
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
    return new Promise((resolve, reject) => {
      try {
        // WebSocket bağlantısını kur
        this.ws = new WebSocket(
          "wss://learning-partially-rabbit.ngrok-free.app/ws/chat"
        );

        this.ws.onopen = async () => {
          console.log("✅ WebSocket bağlantısı açıldı");
          this.isConnected = true;
          this.isConnecting = false;
          this.notifyConnectionListeners("connected", "Bağlantı kuruldu");

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
          // Hata detaylarını status message olarak gönder
          const errorMessage = error.message || JSON.stringify(error);
          console.log(
            "📡 Sending error to connection listeners:",
            errorMessage
          );
          this.notifyConnectionListeners("error", errorMessage);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("❌ WebSocket bağlantısı kapandı");
          this.isConnected = false;
          this.isConnecting = false;
          this.threadId = null;
          this.notifyConnectionListeners("disconnected", "Bağlantı kesildi");
        };
      } catch (constructorError) {
        // WebSocket constructor'da oluşan hatalar
        console.error("❌ WebSocket constructor hatası:", constructorError);
        this.isConnected = false;
        this.isConnecting = false;
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.threadId = null;
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
