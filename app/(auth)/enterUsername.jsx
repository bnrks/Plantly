import React, { useState, useContext } from "react";
import { StyleSheet, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { updateUserDisplayName } from "../../src/services/firestoreService";
import { getAuth, updateProfile } from "firebase/auth";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useCustomAlert } from "../../src/hooks/ui/useCustomAlert";

export default function EnterUsername() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, showSuccess, showError, showWarning, hideAlert } =
    useCustomAlert();

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      showWarning("Uyarı", "Lütfen kullanıcı adınızı girin.");
      return;
    }

    if (username.trim().length < 3) {
      showWarning("Uyarı", "Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);
      
      // Firebase Auth'da displayName güncelle
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: username.trim() });
      }
      
      // Firestore'da displayName güncelle
      await updateUserDisplayName(userId, username.trim());
      
      showSuccess("Harika!", "Şimdi adınızı girelim.", () => {
        hideAlert();
        router.replace({
          pathname: "/enterName",
          params: { userId: userId }
        });
      });
    } catch (e) {
      console.error("Kullanıcı adı kaydetme hatası:", e);
      showError("Hata", "Kullanıcı adı kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={["#A8E6CF", "#DCEDC1", "#FFFFFF"]}
          start={{ x: 0, y: 0.001 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <Image
            source={require("../../assets/plantly-logo.png")}
            style={styles.logo}
          />
          <ThemedCard style={styles.card}>
            <ThemedText style={styles.title}>Hoş Geldiniz! 🌱</ThemedText>
            <ThemedText style={styles.subtitle}>
              Kullanıcı adınızı belirleyin
            </ThemedText>

            <ThemedTextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoFocus={true}
            />

            <ThemedButton
              title={loading ? "Kaydediliyor..." : "Devam Et"}
              onPress={handleSaveUsername}
              style={styles.button}
              disabled={loading}
            />
          </ThemedCard>
        </LinearGradient>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: "contain",
  },
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
  },
  title: {
    alignSelf: "center",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.7,
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
  },
});
