import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import wsService from "../../services/wsService";

export const useWebSocketConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Bağlantı durumu dinleyicisi ekle
    const handleConnectionChange = (status, message) => {
      setConnectionStatus(status);
      setStatusMessage(message);
    };

    wsService.addConnectionListener(handleConnectionChange);

    // Kullanıcı varsa WebSocket bağlantısını kur (thread olmadan)
    if (user) {
      wsService.connect();
    }

    // Cleanup
    return () => {
      wsService.removeConnectionListener(handleConnectionChange);
    };
  }, [user]);

  // WebSocket yeniden bağlanma fonksiyonu
  const reconnectWebSocket = async () => {
    if (!user) {
      console.log("❌ Kullanıcı oturum açmamış, yeniden bağlantı yapılamaz");
      return;
    }

    try {
      console.log("🔄 WebSocket yeniden bağlanıyor...");
      setConnectionStatus("connecting");
      setStatusMessage("Yeniden bağlanıyor...");

      // Önce bağlantıyı kes
      wsService.disconnect();

      // Kısa bir süre bekle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Yeniden bağlan
      await wsService.connect();

      console.log("✅ WebSocket yeniden bağlandı");
    } catch (error) {
      console.error("❌ WebSocket yeniden bağlantı hatası:", error);
      setConnectionStatus("error");
      setStatusMessage("Yeniden bağlantı başarısız");

      // Error'ı global handler'a raporla
      const {
        formatWebSocketError,
      } = require("../../exceptions/chat_exceptions");
      const errorData = formatWebSocketError(error);
      console.log("🔧 Formatted reconnect error:", errorData);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connecting":
        return "#FFA500"; // Orange
      case "connected":
        return "#4CAF50"; // Green
      case "error":
        return "#F44336"; // Red
      default:
        return "#9E9E9E"; // Gray
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return "sync";
      case "connected":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const getDisplayMessage = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Bağlantı kuruluyor...";
      case "connected":
        return "Bağlantı kuruldu";
      case "error":
        return "Bağlantı hatası";
      default:
        return "Bağlantı bekleniyor...";
    }
  };

  return {
    connectionStatus,
    statusMessage,
    reconnectWebSocket,
    getStatusColor,
    getStatusIcon,
    getDisplayMessage,
  };
};
