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
import { fetchNotificationSettings, updateNotificationSettings } from "../../../src/services/firestoreService";

export default function Settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, themeMode, setThemeMode } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;
  const { user, logout } = useContext(AuthContext);
  const { alertConfig, showSuccess, showError, showConfirm, hideAlert } = useCustomAlert();

  // Bildirim ayarlari state'leri
  const [wateringNotif, setWateringNotif] = useState(true);
  const [careNotif, setCareNotif] = useState(true);
  const [diseaseNotif, setDiseaseNotif] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // Dil secenekleri
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage() || "tr");

  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!user?.uid) return;
      try {
        const data = await fetchNotificationSettings(user.uid);
        if (data) {
          setWateringNotif(Boolean(data.wateringReminder));
          setCareNotif(Boolean(data.routineCare));
          setDiseaseNotif(Boolean(data.diseaseAlert));
        }
      } catch (error) {
        console.error("Bildirim ayarlari cekilirken hata:", error);
      }
    };

    loadNotificationSettings();
  }, [user?.uid]);

  const persistNotificationSettings = async (next) => {
    if (!user?.uid) return;
    setSavingNotif(true);
    try {
      await updateNotificationSettings(user.uid, next);
    } catch (error) {
      console.error("Bildirim ayarlari guncellenirken hata:", error);
      showError(t("common.error"), "Bildirim ayarlari kaydedilemedi.");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleWateringToggle = (value) => {
    const next = { wateringReminder: value, routineCare: careNotif, diseaseAlert: diseaseNotif };
    setWateringNotif(value);
    persistNotificationSettings(next);
  };

  const handleCareToggle = (value) => {
    const next = { wateringReminder: wateringNotif, routineCare: value, diseaseAlert: diseaseNotif };
    setCareNotif(value);
    persistNotificationSettings(next);
  };

  const handleDiseaseToggle = (value) => {
    const next = { wateringReminder: wateringNotif, routineCare: careNotif, diseaseAlert: value };
    setDiseaseNotif(value);
    persistNotificationSettings(next);
  };

  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    await setStoredLanguage(langCode);
  };

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
      console.error("Cikis yapilirken hata:", error);
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
      {/* Header Row: BackButton ve Header ayni hizada */}
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

        {/* Tema Secenekleri */}
        <ThemedText style={[styles.sectionLabel, { color: theme.secondaryText }]}>
          {t("settings.theme")}
        </ThemedText>
        <View style={styles.themeContainer}>
          {/* Aydinlik Tema */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              { 
                backgroundColor: themeMode === "light" ? Colors.primary : theme.thirdBg,
                borderColor: themeMode === "light" ? Colors.primary : theme.border || "#999",
              },
            ]}
            onPress={() => setThemeMode("light")}
          >
            <Ionicons 
              name="sunny-outline" 
              size={24} 
              color={themeMode === "light" ? "#fff" : theme.text} 
            />
            <ThemedText 
              style={[
                styles.themeOptionText, 
                { color: themeMode === "light" ? "#fff" : theme.text }
              ]}
            >
              {t("settings.themeLight")}
            </ThemedText>
            {themeMode === "light" && (
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.themeCheck} />
            )}
          </TouchableOpacity>

          {/* Koyu Tema */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              { 
                backgroundColor: themeMode === "dark" ? Colors.primary : theme.thirdBg,
                borderColor: themeMode === "dark" ? Colors.primary : theme.border || "#999",
              },
            ]}
            onPress={() => setThemeMode("dark")}
          >
            <Ionicons 
              name="moon-outline" 
              size={24} 
              color={themeMode === "dark" ? "#fff" : theme.text} 
            />
            <ThemedText 
              style={[
                styles.themeOptionText, 
                { color: themeMode === "dark" ? "#fff" : theme.text }
              ]}
            >
              {t("settings.themeDark")}
            </ThemedText>
            {themeMode === "dark" && (
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.themeCheck} />
            )}
          </TouchableOpacity>

          {/* Sistem Varsayilan */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              { 
                backgroundColor: themeMode === "system" ? Colors.primary : theme.thirdBg,
                borderColor: themeMode === "system" ? Colors.primary : theme.border || "#999",
              },
            ]}
            onPress={() => setThemeMode("system")}
          >
            <Ionicons 
              name="phone-portrait-outline" 
              size={24} 
              color={themeMode === "system" ? "#fff" : theme.text} 
            />
            <ThemedText 
              style={[
                styles.themeOptionText, 
                { color: themeMode === "system" ? "#fff" : theme.text }
              ]}
            >
              {t("settings.themeSystem")}
            </ThemedText>
            {themeMode === "system" && (
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.themeCheck} />
            )}
          </TouchableOpacity>
        </View>
      </ThemedCard>

      {/* Bildirim Ayarlari */}
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
            onValueChange={handleWateringToggle}
            value={wateringNotif}
            disabled={savingNotif}
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
            onValueChange={handleCareToggle}
            value={careNotif}
            disabled={savingNotif}
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
            onValueChange={handleDiseaseToggle}
            value={diseaseNotif}
            disabled={savingNotif}
          />
        </View>
      </ThemedCard>

      {/* Kullanici Bilgileri */}
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

      {/* Dil Secenegi */}
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

      {/* Cikis ve Hesap Sil */}
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
  themeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  themeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
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
