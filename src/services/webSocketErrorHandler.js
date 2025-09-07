// WebSocket Error Handler - Gerçek zamanlı bağlantılar için özelleşmiş hata yönetimi
import globalErrorHandler from "./globalErrorHandler";

class WebSocketErrorHandler {
  constructor() {
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionTimeoutMs = 10000; // 10 seconds

    this.wsInstance = null;
    this.isReconnecting = false;
    this.heartbeatTimer = null;
    this.connectionTimer = null;
    this.messageQueue = [];
    this.listeners = new Map();

    // Connection state
    this.state = {
      status: "disconnected", // disconnected, connecting, connected, reconnecting, failed
      lastConnectedAt: null,
      lastError: null,
      totalReconnects: 0,
    };
  }

  // WebSocket bağlantısı oluştur
  connect(url, protocols = []) {
    return new Promise((resolve, reject) => {
      try {
        this.state.status = "connecting";
        this.connectionAttempts++;

        console.log(
          `🔌 WebSocket connecting to ${url} (attempt ${this.connectionAttempts})`
        );

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.state.status === "connecting") {
            this.handleConnectionTimeout();
            reject(new Error("WebSocket connection timeout"));
          }
        }, this.connectionTimeoutMs);

        this.wsInstance = new WebSocket(url, protocols);

        this.wsInstance.onopen = (event) => {
          this.handleConnectionOpen(event);
          clearTimeout(this.connectionTimer);
          resolve(this.wsInstance);
        };

        this.wsInstance.onclose = (event) => {
          this.handleConnectionClose(event);
          clearTimeout(this.connectionTimer);
        };

        this.wsInstance.onerror = (event) => {
          this.handleConnectionError(event);
          clearTimeout(this.connectionTimer);
          reject(event);
        };

        this.wsInstance.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.handleConnectionError({ error });
        reject(error);
      }
    });
  }

  // Bağlantı açıldığında
  handleConnectionOpen(event) {
    console.log("✅ WebSocket connected successfully");

    this.state.status = "connected";
    this.state.lastConnectedAt = new Date().toISOString();
    this.connectionAttempts = 0;
    this.isReconnecting = false;

    // Heartbeat başlat
    this.startHeartbeat();

    // Kuyruktaki mesajları gönder
    this.flushMessageQueue();

    // Listeners'ı bilgilendir
    this.emitEvent("connected", {
      event,
      attempts: this.connectionAttempts,
      totalReconnects: this.state.totalReconnects,
    });
  }

  // Bağlantı kapandığında
  handleConnectionClose(event) {
    console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);

    this.state.status = "disconnected";
    this.state.lastError = {
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString(),
    };

    // Heartbeat durdur
    this.stopHeartbeat();

    // Hata raporla
    globalErrorHandler.reportWebSocketError(
      new Error(`WebSocket closed: ${event.code} - ${event.reason}`),
      {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        connectionAttempts: this.connectionAttempts,
        showToUser: true, // Kullanıcıya göster
      }
    );

    // Yeniden bağlanmayı dene
    if (this.shouldReconnect(event)) {
      this.scheduleReconnect();
    }

    // Listeners'ı bilgilendir
    this.emitEvent("disconnected", {
      event,
      error: this.state.lastError,
    });
  }

  // Bağlantı hatası
  handleConnectionError(event) {
    const error = event.error || new Error("WebSocket connection error");

    console.error("🚨 WebSocket error:", error);

    this.state.status = "failed";
    this.state.lastError = {
      message: error.message,
      type: error.type || "connection_error",
      timestamp: new Date().toISOString(),
    };

    // Hata raporla
    globalErrorHandler.reportWebSocketError(error, {
      connectionAttempts: this.connectionAttempts,
      isReconnecting: this.isReconnecting,
      showToUser: true, // Kullanıcıya göster
    });

    // Listeners'ı bilgilendir
    this.emitEvent("error", {
      error,
      attempts: this.connectionAttempts,
    });
  }

  // Connection timeout
  handleConnectionTimeout() {
    console.error("⏰ WebSocket connection timeout");

    const error = new Error("WebSocket connection timeout");
    this.state.status = "failed";
    this.state.lastError = {
      message: error.message,
      type: "timeout",
      timestamp: new Date().toISOString(),
    };

    if (this.wsInstance) {
      this.wsInstance.close();
    }

    globalErrorHandler.reportWebSocketError(error, {
      type: "timeout",
      connectionAttempts: this.connectionAttempts,
      timeoutMs: this.connectionTimeoutMs,
      showToUser: true, // Kullanıcıya göster
    });
  }

  // Mesaj geldiğinde
  handleMessage(event) {
    try {
      // Heartbeat response kontrolü
      if (event.data === "pong") {
        return; // Heartbeat response
      }

      // JSON parse et
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (parseError) {
        data = event.data; // Raw string olarak kullan
      }

      // Listeners'ı bilgilendir
      this.emitEvent("message", { data, raw: event.data });
    } catch (error) {
      console.error("🚨 Error handling WebSocket message:", error);
      globalErrorHandler.reportError(error, {
        type: "websocket_message_parse",
        messageData: event.data?.substring(0, 100), // İlk 100 karakter
        showToUser: false,
      });
    }
  }

  // Yeniden bağlanma gerekli mi?
  shouldReconnect(event) {
    // Manuel close (1000) -> Yeniden bağlanma
    if (event.code === 1000) return false;

    // Server restart (1012) -> Yeniden bağlan
    if (event.code === 1012) return true;

    // Abnormal closure (1006) -> Yeniden bağlan
    if (event.code === 1006) return true;

    // Max attempt'e ulaştıysak dur
    if (this.connectionAttempts >= this.maxReconnectAttempts) return false;

    // Diğer durumlarda yeniden bağlan
    return true;
  }

  // Yeniden bağlanmayı planla
  scheduleReconnect() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.state.status = "reconnecting";

    const delay = this.calculateReconnectDelay();

    console.log(
      `🔄 Scheduling WebSocket reconnect in ${delay}ms (attempt ${
        this.connectionAttempts + 1
      }/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this.isReconnecting) {
        this.state.totalReconnects++;
        this.reconnect();
      }
    }, delay);

    // Listeners'ı bilgilendir
    this.emitEvent("reconnecting", {
      delay,
      attempt: this.connectionAttempts + 1,
      maxAttempts: this.maxReconnectAttempts,
    });
  }

  // Reconnect delay hesapla (exponential backoff)
  calculateReconnectDelay() {
    const exponentialDelay =
      this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.maxReconnectDelay);
  }

  // Yeniden bağlan
  async reconnect() {
    if (!this.isReconnecting) return;

    try {
      // Önceki bağlantıyı temizle
      if (this.wsInstance) {
        this.wsInstance.close();
      }

      // Yeni bağlantı oluştur (URL'yi dışarıdan alacağız)
      if (this.lastConnectionUrl) {
        await this.connect(
          this.lastConnectionUrl,
          this.lastConnectionProtocols
        );
      }
    } catch (error) {
      console.error("🚨 Reconnect failed:", error);

      if (this.connectionAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        this.isReconnecting = false;
        this.state.status = "failed";

        globalErrorHandler.reportWebSocketError(
          new Error("Max reconnect attempts exceeded"),
          {
            maxAttempts: this.maxReconnectAttempts,
            totalReconnects: this.state.totalReconnects,
            showToUser: true,
          }
        );

        this.emitEvent("reconnect_failed", {
          attempts: this.connectionAttempts,
          maxAttempts: this.maxReconnectAttempts,
        });
      }
    }
  }

  // Mesaj gönder
  send(data) {
    if (this.state.status === "connected" && this.wsInstance) {
      try {
        const message = typeof data === "string" ? data : JSON.stringify(data);
        this.wsInstance.send(message);
        return true;
      } catch (error) {
        console.error("🚨 Error sending WebSocket message:", error);
        globalErrorHandler.reportWebSocketError(error, {
          type: "send_error",
          showToUser: false,
        });

        // Kuyruğa ekle
        this.queueMessage(data);
        return false;
      }
    } else {
      // Bağlantı yoksa kuyruğa ekle
      this.queueMessage(data);
      return false;
    }
  }

  // Mesajı kuyruğa ekle
  queueMessage(data) {
    this.messageQueue.push({
      data,
      timestamp: Date.now(),
    });

    // Queue limit
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift(); // İlk mesajı çıkar
    }
  }

  // Kuyruktaki mesajları gönder
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { data } = this.messageQueue.shift();
      this.send(data);
    }
  }

  // Heartbeat başlat
  startHeartbeat() {
    this.stopHeartbeat(); // Önceki timer'ı temizle

    this.heartbeatTimer = setInterval(() => {
      if (this.state.status === "connected") {
        this.send("ping");
      }
    }, this.heartbeatInterval);
  }

  // Heartbeat durdur
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Event listener ekle
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Event listener kaldır
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Event emit et
  emitEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in WebSocket event listener for ${event}:`,
            error
          );
        }
      });
    }
  }

  // Bağlantıyı kapat
  disconnect() {
    this.isReconnecting = false;
    this.stopHeartbeat();

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
    }

    if (this.wsInstance) {
      this.wsInstance.close(1000, "Manual disconnect");
    }

    this.state.status = "disconnected";
  }

  // Connection durumunu al
  getConnectionState() {
    return {
      ...this.state,
      isConnected: this.state.status === "connected",
      isConnecting: this.state.status === "connecting",
      isReconnecting: this.isReconnecting,
      queuedMessages: this.messageQueue.length,
      connectionAttempts: this.connectionAttempts,
    };
  }

  // Connection'ı yeniden yapılandır
  configure(config) {
    this.maxReconnectAttempts =
      config.maxReconnectAttempts || this.maxReconnectAttempts;
    this.reconnectDelay = config.reconnectDelay || this.reconnectDelay;
    this.maxReconnectDelay = config.maxReconnectDelay || this.maxReconnectDelay;
    this.heartbeatInterval = config.heartbeatInterval || this.heartbeatInterval;
    this.connectionTimeoutMs =
      config.connectionTimeoutMs || this.connectionTimeoutMs;
  }

  // Easy connect method
  async connectTo(url, protocols = []) {
    this.lastConnectionUrl = url;
    this.lastConnectionProtocols = protocols;
    return this.connect(url, protocols);
  }
}

// Export singleton instance
const webSocketErrorHandler = new WebSocketErrorHandler();

export default webSocketErrorHandler;
