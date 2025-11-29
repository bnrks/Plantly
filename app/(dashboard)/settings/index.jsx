import { useContext, useState, useEffect } from "react";
import { StyleSheet, View, Switch, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import ScreenContainer from "../../../components/ScreenContainer";
import BackButton from "../../../components/BackButton";
import Header from "../../../components/Header";
import { AuthContext } from "../../../src/context/AuthContext";
import { deleteUserAccount } from "../../../src/services/authService";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../src/hooks/ui/useCustomAlert";
import { SUPPORTED_LANGUAGES, setStoredLanguage, getCurrentLanguage } from "../../../src/locales";

export default function Settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, toggleTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;
  const { user, logout } = useContext(AuthContext);
  const { alertConfig, showSuccess, showError, showConfirm, hideAlert } = useCustomAlert();

  // Bildirim ayarları state'leri
  const [wateringNotif, setWateringNotif] = useState(true);
  const [careNotif, setCareNotif] = useState(true);
  const [diseaseNotif, setDiseaseNotif] = useState(true);

  // Dil seçeneği state
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage() || "tr");

  // Dil değiştirme fonksiyonu
  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    await setStoredLanguage(langCode);
  };

  // User yoksa erken return
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess(t("common.success"), t("settings.logoutSuccess"), () => {
        hideAlert();
        router.replace("/login");
      });
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
      showError(t("common.error"), t("settings.logoutError"));
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      t("settings.deleteAccount"),
      t("settings.deleteAccountConfirm"),
      async () => {
        try {
          hideAlert();
          await deleteUserAccount(user.uid);
          showSuccess(t("common.success"), t("settings.deleteAccountSuccess"), () => {
            hideAlert();
            router.replace("/login");
          });
        } catch (error) {
          console.error("Hesap silinirken hata:", error);
          if (error.code === "auth/requires-recent-login") {
            showError(t("common.error"), t("settings.reloginRequired"));
          } else {
            showError(t("common.error"), t("settings.deleteAccountError"));
          }
        }
      },
      () => hideAlert()
    );
  };

  return (
    <ScreenContainer scrollable topSpacing={24} bottomSpacing={40}>
      {/* Header Row: BackButton ve Header aynı hizada */}
      <View style={styles.headerRow}>
        <BackButton style={styles.backButton} />
        <View style={styles.headerWrapper}>
          <Header />
        </View>
      </View>

      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.title}>{t("settings.title")}</ThemedTitle>

        {/* Tema Değiştirme */}
        <View style={[styles.section, { backgroundColor: theme.thirdBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="moon-outline" size={22} color={currentTheme === "dark" ? theme.text : theme.title} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>{t("settings.darkMode")}</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor={currentTheme === "dark" ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={currentTheme === "dark"}
          />
        </View>
      </ThemedCard>

      {/* Bildirim Ayarları */}
      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t("settings.notifications")}</ThemedTitle>

        <View style={[styles.section, { backgroundColor: theme.thirdBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="water-outline" size={22} color={currentTheme === "dark" ? theme.text : theme.title} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>{t("settings.wateringReminders")}</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor={wateringNotif ? Colors.success : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setWateringNotif}
            value={wateringNotif}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.thirdBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="calendar-outline" size={22} color={currentTheme === "dark" ? theme.text : theme.title} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>{t("settings.routineCare")}</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor={careNotif ? Colors.success : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setCareNotif}
            value={careNotif}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.thirdBg, marginBottom: 0 }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="warning-outline" size={22} color={currentTheme === "dark" ? theme.text : theme.title} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>{t("settings.diseaseAlerts")}</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor={diseaseNotif ? Colors.success : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setDiseaseNotif}
            value={diseaseNotif}
          />
        </View>
      </ThemedCard>

      {/* Kullanıcı Bilgileri */}
      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t("settings.userInfo")}</ThemedTitle>

        <View style={[styles.infoSection, { backgroundColor: theme.thirdBg }]}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>{t("settings.email")}</ThemedText>
              <ThemedText style={styles.infoValue}>{user.email || t("settings.notSpecified")}</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: theme.thirdBg, marginBottom: 0 }]}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>{t("settings.username")}</ThemedText>
              <ThemedText style={styles.infoValue}>{user.displayName || user.email?.split("@")[0] || t("settings.notSpecified")}</ThemedText>
            </View>
          </View>
        </View>
      </ThemedCard>

      {/* Dil Seçeneği */}
      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t("settings.language")}</ThemedTitle>

        <View style={styles.languageContainer}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === lang.code ? Colors.primary : theme.thirdBg,
                  borderColor: selectedLanguage === lang.code ? Colors.primary : "#999",
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <ThemedText style={styles.flagEmoji}>{lang.flag}</ThemedText>
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ThemedCard>

      {/* Çıkış ve Hesabı Sil */}
      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t("settings.accountActions")}</ThemedTitle>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.primary }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#000" />
          <ThemedText style={styles.logoutButtonText}>{t("settings.logout")}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.danger }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={22} color={theme.danger} />
          <ThemedText style={[styles.deleteButtonText, { color: theme.danger }]}>
            {t("settings.deleteAccount")}
          </ThemedText>
        </TouchableOpacity>
      </ThemedCard>

      {/* Versiyon Bilgisi */}
      <View style={styles.versionContainer}>
        <ThemedText style={[styles.versionText, { color: theme.secondaryText }]}>
          Plantly v{Constants.expoConfig?.version || "1.0.0"}
        </ThemedText>
      </View>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 1,
  },
  headerWrapper: {
    flex: 1,
    alignItems: "center",
  },
  settingsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionText: {
    fontSize: 17,
    fontWeight: "600",
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  languageContainer: {
    flexDirection: "row",
    gap: 12,
  },
  languageOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  languageText: {
    fontSize: 17,
    fontWeight: "700",
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
