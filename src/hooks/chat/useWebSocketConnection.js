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
  const reconnectWebSocket = () => {
    if (user) {
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect();
      }, 1000);
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
