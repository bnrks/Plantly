// Chat ile ilgili özel hata sınıfları ve yönetimi

export class ChatConnectionError extends Error {
  constructor(originalError) {
    super("WebSocket bağlantısı kurulamadı");
    this.name = "ChatConnectionError";
    this.type = "connection";
    this.originalError = originalError;
    this.userMessage =
      "Sohbet sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.";
    this.retryable = true;
  }
}

export class ChatTimeoutError extends Error {
  constructor(originalError) {
    super("Bağlantı zaman aşımına uğradı");
    this.name = "ChatTimeoutError";
    this.type = "timeout";
    this.originalError = originalError;
    this.userMessage = "Bağlantı çok uzun sürdü. Lütfen tekrar deneyin.";
    this.retryable = true;
  }
}

export class ChatServerError extends Error {
  constructor(originalError) {
    super("Sunucu hatası");
    this.name = "ChatServerError";
    this.type = "server";
    this.originalError = originalError;
    this.userMessage =
      "Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.";
    this.retryable = true;
  }
}

export class ChatNetworkError extends Error {
  constructor(originalError) {
    super("Ağ bağlantısı hatası");
    this.name = "ChatNetworkError";
    this.type = "network";
    this.originalError = originalError;
    this.userMessage =
      "İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.";
    this.retryable = true;
  }
}

// Hata türü belirleyici fonksiyon
export const determineChatError = (error) => {
  if (!error) {
    return new ChatServerError(error);
  }

  const errorMessage = error.message || error.toString();
  const errorString = errorMessage.toLowerCase();

  // WebSocket 404 hatası - sunucu bulunamadı
  if (errorString.includes("404") || errorString.includes("not found")) {
    return new ChatConnectionError(error);
  }

  // WebSocket bağlantı hataları
  if (errorString.includes("websocket") || errorString.includes("ws")) {
    return new ChatConnectionError(error);
  }

  // HTTP response hataları
  if (
    errorString.includes("http") &&
    (errorString.includes("101") || errorString.includes("response"))
  ) {
    return new ChatConnectionError(error);
  }

  // Network bağlantı hataları
  if (errorString.includes("network") || errorString.includes("fetch")) {
    return new ChatNetworkError(error);
  }

  // Timeout hataları
  if (errorString.includes("timeout") || errorString.includes("time")) {
    return new ChatTimeoutError(error);
  }

  // 5xx server hataları
  if (errorString.includes("50") || errorString.includes("server")) {
    return new ChatServerError(error);
  }

  // Varsayılan olarak bağlantı hatası
  return new ChatConnectionError(error);
};

// Hata mesajı formatlayıcı
export const formatChatError = (error) => {
  const chatError = determineChatError(error);

  return {
    title: "Bağlantı Sorunu",
    message: chatError.userMessage,
    type: chatError.type,
    retryable: chatError.retryable,
    originalError: chatError.originalError,
    icon: getErrorIcon(chatError.type),
    color: getErrorColor(chatError.type),
  };
};

// Hata türüne göre ikon
const getErrorIcon = (type) => {
  switch (type) {
    case "connection":
      return "wifi-off";
    case "network":
      return "cloud-offline";
    case "timeout":
      return "time";
    case "server":
      return "server";
    default:
      return "alert-circle";
  }
};

// Hata türüne göre renk
const getErrorColor = (type) => {
  switch (type) {
    case "connection":
      return "#FF9800"; // Turuncu
    case "network":
      return "#F44336"; // Kırmızı
    case "timeout":
      return "#FFC107"; // Sarı
    case "server":
      return "#9C27B0"; // Mor
    default:
      return "#F44336"; // Varsayılan kırmızı
  }
};
