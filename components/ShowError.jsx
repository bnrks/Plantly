import React, { useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import ThemedTitle from "./ThemedTitle";
import ThemedCard from "./ThemedCard";
import { Colors } from "../constants/Colors";
import { ThemeContext } from "../src/context/ThemeContext";

const ShowError = ({
  error,
  title = "Bir Hata Oluştu",
  message,
  showRetry = true,
  onRetry,
  showClose = false,
  onClose,
  style,
  icon = "alert-circle",
  iconColor,
}) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  // Hata mesajını belirle
  const getErrorMessage = () => {
    if (message) return message;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
  };

  // Hata türüne göre renk belirle
  const getErrorColor = () => {
    if (iconColor) return iconColor;

    // Hata türüne göre varsayılan renkler
    const errorString = error?.toString().toLowerCase() || "";

    if (errorString.includes("network") || errorString.includes("internet")) {
      return "#FF9800"; // Turuncu - Bağlantı hatası
    }
    if (errorString.includes("permission") || errorString.includes("auth")) {
      return "#FF5722"; // Kırmızı-turuncu - Yetki hatası
    }
    if (errorString.includes("timeout")) {
      return "#FFC107"; // Sarı - Zaman aşımı
    }

    return "#F44336"; // Varsayılan kırmızı
  };

  // Hata türüne göre ikon belirle
  const getErrorIcon = () => {
    if (icon !== "alert-circle") return icon;

    const errorString = error?.toString().toLowerCase() || "";

    if (errorString.includes("network") || errorString.includes("internet")) {
      return "wifi-off";
    }
    if (errorString.includes("permission") || errorString.includes("auth")) {
      return "lock-closed";
    }
    if (errorString.includes("timeout")) {
      return "time";
    }

    return "alert-circle";
  };

  const errorColor = getErrorColor();
  const errorIcon = getErrorIcon();

  return (
    <ThemedCard style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Hata İkonu */}
        <View
          style={[styles.iconContainer, { backgroundColor: errorColor + "20" }]}
        >
          <Ionicons name={errorIcon} size={32} color={errorColor} />
        </View>

        {/* Hata Başlığı */}
        <ThemedTitle style={[styles.title, { color: errorColor }]}>
          {title}
        </ThemedTitle>

        {/* Hata Mesajı */}
        <ThemedText style={styles.message}>{getErrorMessage()}</ThemedText>

        {/* Hata Detayı (Debug modunda) */}
        {__DEV__ && error && (
          <View style={styles.debugContainer}>
            <ThemedText style={styles.debugTitle}>Debug Bilgisi:</ThemedText>
            <ThemedText style={styles.debugText}>
              {error.stack || error.toString()}
            </ThemedText>
          </View>
        )}

        {/* Aksiyon Butonları */}
        <View style={styles.actionsContainer}>
          {showRetry && onRetry && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.retryButton,
                { backgroundColor: errorColor },
              ]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Tekrar Dene</ThemedText>
            </TouchableOpacity>
          )}

          {showClose && onClose && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.closeButton,
                { borderColor: theme.text + "30" },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color={theme.text} />
              <ThemedText style={[styles.buttonText, { color: theme.text }]}>
                Kapat
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 0,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.8,
  },
  debugContainer: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.7,
  },
  debugText: {
    fontSize: 10,
    fontFamily: "monospace",
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  retryButton: {
    // backgroundColor dinamik olarak ayarlanıyor
  },
  closeButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ShowError;
