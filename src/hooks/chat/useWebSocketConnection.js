import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Colors } from "../../../constants/Colors";

export const useWebSocketConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // WS kaldırıldı: HTTP modunda bağlantı konsepti yok.
    // Kullanıcı varsa "ready" kabul ediyoruz.
    if (user) {
      setConnectionStatus("connected");
      setStatusMessage("HTTP modu");
    } else {
      setConnectionStatus("disconnected");
      setStatusMessage("Oturum bekleniyor...");
    }
  }, [user]);

  // WebSocket yeniden bağlanma fonksiyonu
  const reconnectWebSocket = async () => {
    // HTTP modunda reconnect gerekmiyor; UI uyumu için no-op.
    if (!user) return;
    setConnectionStatus("connected");
    setStatusMessage("HTTP modu");
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connecting":
        return "#FFA500"; // Orange
      case "connected":
        return Colors.primary; // Green
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
        return "Hazırlanıyor...";
      case "connected":
        return "Hazır (HTTP)";
      case "error":
        return "Bağlantı hatası";
      default:
        return "Oturum bekleniyor...";
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
