import React, { useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../context/ThemeContext";

// Chat Screen için özel fallback
export const ChatErrorFallback = ({ error, onRetry, onReset }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>
        <View
          style={[styles.iconContainer, { backgroundColor: "#FF9800" + "20" }]}
        >
          <Ionicons name="chatbubble-ellipses" size={40} color="#FF9800" />
        </View>

        <ThemedText style={styles.title}>Sohbet Hatası</ThemedText>
        <ThemedText style={styles.message}>
          Sohbet sayfasında bir sorun oluştu. Bağlantınızı kontrol edin ve
          tekrar deneyin.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Tekrar Dene"
            onPress={onRetry}
            style={[styles.button, { backgroundColor: "#FF9800" }]}
            icon={<Ionicons name="refresh" size={18} color="#FFF" />}
          />
          <ThemedButton
            title="Ana Sayfa"
            onPress={() => router.replace("/(dashboard)/(tabs)/home")}
            style={[styles.button, styles.secondaryButton]}
            textStyle={{ color: theme.text }}
            icon={<Ionicons name="home" size={18} color={theme.text} />}
          />
        </View>
      </ThemedCard>
    </ThemedView>
  );
};

// Plant sayfaları için özel fallback
export const PlantErrorFallback = ({ error, onRetry, onReset }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>
        <View
          style={[styles.iconContainer, { backgroundColor: "#4CAF50" + "20" }]}
        >
          <Ionicons name="leaf" size={40} color="#4CAF50" />
        </View>

        <ThemedText style={styles.title}>Bitki Verileri Hatası</ThemedText>
        <ThemedText style={styles.message}>
          Bitki bilgileri yüklenirken bir sorun oluştu. Tekrar deneyebilir veya
          bitkilerim sayfasına dönebilirsiniz.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Tekrar Dene"
            onPress={onRetry}
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
            icon={<Ionicons name="refresh" size={18} color="#FFF" />}
          />
          <ThemedButton
            title="Bitkilerim"
            onPress={() => router.replace("/(dashboard)/(tabs)/myPlants")}
            style={[styles.button, styles.secondaryButton]}
            textStyle={{ color: theme.text }}
            icon={<Ionicons name="leaf" size={18} color={theme.text} />}
          />
        </View>
      </ThemedCard>
    </ThemedView>
  );
};

// Analysis sayfası için özel fallback
export const AnalysisErrorFallback = ({ error, onRetry, onReset }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>
        <View
          style={[styles.iconContainer, { backgroundColor: "#9C27B0" + "20" }]}
        >
          <Ionicons name="analytics" size={40} color="#9C27B0" />
        </View>

        <ThemedText style={styles.title}>Analiz Hatası</ThemedText>
        <ThemedText style={styles.message}>
          Bitki analizi yapılırken bir sorun oluştu. Fotoğrafınızı kontrol edin
          ve tekrar deneyin.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Tekrar Dene"
            onPress={onRetry}
            style={[styles.button, { backgroundColor: "#9C27B0" }]}
            icon={<Ionicons name="refresh" size={18} color="#FFF" />}
          />
          <ThemedButton
            title="Yeni Analiz"
            onPress={() => router.replace("/(dashboard)/analysis")}
            style={[styles.button, styles.secondaryButton]}
            textStyle={{ color: theme.text }}
            icon={<Ionicons name="camera" size={18} color={theme.text} />}
          />
        </View>
      </ThemedCard>
    </ThemedView>
  );
};

// Micro component'ler için minimal fallback
export const MicroErrorFallback = ({ error, onRetry }) => {
  return (
    <View style={styles.microContainer}>
      <TouchableOpacity onPress={onRetry} style={styles.microButton}>
        <Ionicons name="refresh" size={16} color="#999" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 350,
    padding: 20,
    borderRadius: 16,
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
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  microContainer: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  microButton: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});

// Dashboard Error Fallback
export function DashboardErrorFallback({ error, resetError, retryFunction }) {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const handleGoHome = () => {
    resetError();
    router.replace("/(dashboard)/(tabs)/home");
  };

  const handleRestart = () => {
    resetError();
    // Dashboard'u yeniden başlat
    if (retryFunction) {
      retryFunction();
    }
  };

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ThemedView
        style={[styles.content, { backgroundColor: theme.colors.card }]}
      >
        <ThemedText style={[styles.icon, { color: theme.colors.error }]}>
          🏠
        </ThemedText>

        <ThemedTitle style={[styles.title, { color: theme.colors.error }]}>
          Dashboard Hatası
        </ThemedTitle>

        <ThemedText style={[styles.message, { color: theme.colors.text }]}>
          Dashboard yüklenirken bir sorun oluştu. Ana sayfaya dönerek devam
          edebilirsiniz.
        </ThemedText>

        {__DEV__ && (
          <ThemedText
            style={[styles.debugText, { color: theme.colors.textSecondary }]}
          >
            Hata: {error?.message || "Bilinmeyen hata"}
          </ThemedText>
        )}

        <ThemedView style={styles.buttonContainer}>
          <ThemedButton onPress={handleGoHome} style={styles.primaryButton}>
            <ThemedText style={styles.buttonText}>
              🏠 Ana Sayfaya Dön
            </ThemedText>
          </ThemedButton>

          <ThemedButton
            onPress={handleRestart}
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.border },
            ]}
          >
            <ThemedText
              style={[styles.buttonText, { color: theme.colors.text }]}
            >
              🔄 Yeniden Dene
            </ThemedText>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

// Auth Error Fallback
export function AuthErrorFallback({ error, resetError, retryFunction }) {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const handleGoLogin = () => {
    resetError();
    router.replace("/login");
  };

  const handleRestart = () => {
    resetError();
    if (retryFunction) {
      retryFunction();
    }
  };

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ThemedView
        style={[styles.content, { backgroundColor: theme.colors.card }]}
      >
        <ThemedText style={[styles.icon, { color: theme.colors.error }]}>
          🔐
        </ThemedText>

        <ThemedTitle style={[styles.title, { color: theme.colors.error }]}>
          Giriş Hatası
        </ThemedTitle>

        <ThemedText style={[styles.message, { color: theme.colors.text }]}>
          Giriş ekranı yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </ThemedText>

        {__DEV__ && (
          <ThemedText
            style={[styles.debugText, { color: theme.colors.textSecondary }]}
          >
            Hata: {error?.message || "Bilinmeyen hata"}
          </ThemedText>
        )}

        <ThemedView style={styles.buttonContainer}>
          <ThemedButton onPress={handleGoLogin} style={styles.primaryButton}>
            <ThemedText style={styles.buttonText}>
              🔐 Giriş Ekranına Dön
            </ThemedText>
          </ThemedButton>

          <ThemedButton
            onPress={handleRestart}
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.border },
            ]}
          >
            <ThemedText
              style={[styles.buttonText, { color: theme.colors.text }]}
            >
              🔄 Yeniden Dene
            </ThemedText>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

export default {
  ChatErrorFallback,
  PlantErrorFallback,
  AnalysisErrorFallback,
  MicroErrorFallback,
  DashboardErrorFallback,
  AuthErrorFallback,
};
