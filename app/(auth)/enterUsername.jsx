import React, { useState, useContext } from "react";
import { StyleSheet, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      showWarning(t('common.warning'), t('auth.enterUsername'));
      return;
    }

    if (username.trim().length < 3) {
      showWarning(t('common.warning'), t('auth.usernameMinLength'));
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
      
      showSuccess(t('common.success'), t('auth.nowEnterName'), () => {
        hideAlert();
        router.replace({
          pathname: "/enterName",
          params: { userId: userId }
        });
      });
    } catch (e) {
      console.error("Username save error:", e);
      showError(t('common.error'), t('auth.usernameSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={
            selectedTheme === "dark"
              ? ["#2D3D34", "#243029", "#1A2420"]
              : ["#A8E6CF", "#DCEDC1", "#FFFFFF"]
          }
          start={{ x: 0, y: 0.001 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <Image
            source={require("../../assets/enter_username.png")}
            style={styles.logo}
          />
          <ThemedCard style={styles.card}>
            <ThemedText style={styles.title}>{t('auth.welcome')} 🌱</ThemedText>
            <ThemedText style={styles.subtitle}>
              {t('auth.setUsername')}
            </ThemedText>

            <ThemedTextInput
              style={styles.input}
              placeholder={t('auth.username')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoFocus={true}
            />

            <ThemedButton
              title={loading ? t('common.loading') : t('auth.continue')}
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
    width: 250,
    height: 190,
    marginBottom: -30,
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
