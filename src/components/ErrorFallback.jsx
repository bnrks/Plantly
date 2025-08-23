import React, { useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedTitle from "../../components/ThemedTitle";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../context/ThemeContext";

const ErrorFallback = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  boundaryName = "Bilinmeyen",
  level = "component",
}) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();

  // Error seviyesine göre mesaj ve ikon belirleme
  const getErrorDetails = () => {
    switch (level) {
      case "app":
        return {
          title: "Uygulama Hatası",
          message:
            "Uygulamada beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın.",
          icon: "warning",
          color: "#F44336",
          showHomeButton: true,
        };
      case "screen":
        return {
          title: "Sayfa Hatası",
          message:
            "Bu sayfada bir sorun oluştu. Ana sayfaya dönebilir veya tekrar deneyebilirsiniz.",
          icon: "alert-circle",
          color: "#FF9800",
          showHomeButton: true,
        };
      case "component":
      default:
        return {
          title: "Bir Sorun Oluştu",
          message:
            "Bu bölümde geçici bir sorun yaşanıyor. Tekrar deneyebilirsiniz.",
          icon: "refresh-circle",
          color: "#2196F3",
          showHomeButton: false,
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleGoHome = () => {
    try {
      router.replace("/(dashboard)/(tabs)/home");
    } catch (routerError) {
      console.error("Router error in ErrorFallback:", routerError);
      // Router da çalışmıyorsa, en azından reset deneyelim
      onReset();
    }
  };

  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      onReset();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedCard
        style={[styles.errorCard, { borderColor: errorDetails.color }]}
      >
        {/* Error Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: errorDetails.color + "20" },
          ]}
        >
          <Ionicons
            name={errorDetails.icon}
            size={48}
            color={errorDetails.color}
          />
        </View>

        {/* Error Title */}
        <ThemedTitle style={[styles.title, { color: errorDetails.color }]}>
          {errorDetails.title}
        </ThemedTitle>

        {/* Error Message */}
        <ThemedText style={styles.message}>{errorDetails.message}</ThemedText>

        {/* Development Info */}
        {__DEV__ && error && (
          <View style={styles.devInfo}>
            <ThemedText style={styles.devTitle}>
              Geliştirici Bilgisi:
            </ThemedText>
            <ThemedText style={styles.devText}>
              Boundary: {boundaryName}
            </ThemedText>
            <ThemedText style={styles.devText}>
              Hata: {error.message || error.toString()}
            </ThemedText>
            {error.stack && (
              <ThemedText style={styles.devStack} numberOfLines={3}>
                Stack: {error.stack}
              </ThemedText>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Retry Button */}
          <ThemedButton
            title="Tekrar Dene"
            onPress={handleRefresh}
            style={[styles.button, { backgroundColor: errorDetails.color }]}
            icon={<Ionicons name="refresh" size={20} color="#FFFFFF" />}
          />

          {/* Home Button (sadece screen/app level'da) */}
          {errorDetails.showHomeButton && (
            <ThemedButton
              title="Ana Sayfa"
              onPress={handleGoHome}
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: theme.text + "30",
                  backgroundColor: "transparent",
                },
              ]}
              textStyle={{ color: theme.text }}
              icon={<Ionicons name="home" size={20} color={theme.text} />}
            />
          )}
        </View>

        {/* Error ID for support */}
        <ThemedText style={styles.errorId}>
          Hata Kodu: {Date.now().toString().slice(-8)}
        </ThemedText>
      </ThemedCard>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.8,
  },
  devInfo: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  devTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.7,
  },
  devText: {
    fontSize: 11,
    marginBottom: 2,
    opacity: 0.6,
  },
  devStack: {
    fontSize: 10,
    fontFamily: "monospace",
    opacity: 0.5,
    marginTop: 4,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  errorId: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 16,
    textAlign: "center",
  },
});

export default ErrorFallback;
