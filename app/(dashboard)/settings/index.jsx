import { useContext, useState } from "react";
import { StyleSheet, View, Switch, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../src/hooks/ui/useCustomAlert";

export default function Settings() {
  const router = useRouter();
  const { theme: currentTheme, toggleTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;
  const { user, logout } = useContext(AuthContext);
  const { alertConfig, showSuccess, showError, showConfirm, hideAlert } = useCustomAlert();

  // Bildirim ayarları state'leri
  const [wateringNotif, setWateringNotif] = useState(true);
  const [careNotif, setCareNotif] = useState(true);
  const [diseaseNotif, setDiseaseNotif] = useState(true);

  // Dil seçeneği state
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const languages = [
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  // User yoksa erken return
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess("Başarılı", "Çıkış yapıldı", () => {
        hideAlert();
        router.replace("/login");
      });
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
      showError("Hata", "Çıkış yapılırken bir hata oluştu");
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      "Hesabı Sil",
      "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.",
      async () => {
        try {
          // TODO: Hesap silme işlemi burada yapılacak
          showSuccess("Başarılı", "Hesabınız silindi", () => {
            hideAlert();
            router.replace("/login");
          });
        } catch (error) {
          console.error("Hesap silinirken hata:", error);
          showError("Hata", "Hesap silinirken bir hata oluştu");
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
        <ThemedTitle style={styles.title}>Ayarlar</ThemedTitle>

        {/* Tema Değiştirme */}
        <View style={[styles.section, { backgroundColor: theme.fourthBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="moon-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>Koyu Mod</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
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
        <ThemedTitle style={styles.sectionTitle}>Bildirim Ayarları</ThemedTitle>

        <View style={[styles.section, { backgroundColor: theme.fourthBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="water-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>Sulama Hatırlatıcıları</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={wateringNotif ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setWateringNotif}
            value={wateringNotif}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.fourthBg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="calendar-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>Rutin Bakım Bildirimleri</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={careNotif ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setCareNotif}
            value={careNotif}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.fourthBg, marginBottom: 0 }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="warning-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <ThemedText style={styles.sectionText}>Hastalık Uyarıları</ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={diseaseNotif ? "#4CAF50" : "#f4f3f4"}
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
        <ThemedTitle style={styles.sectionTitle}>Kullanıcı Bilgileri</ThemedTitle>

        <View style={[styles.infoSection, { backgroundColor: theme.fourthBg }]}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>E-posta</ThemedText>
              <ThemedText style={styles.infoValue}>{user.email || "Belirtilmemiş"}</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: theme.fourthBg, marginBottom: 0 }]}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={22} color={theme.text} style={styles.sectionIcon} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Kullanıcı Adı</ThemedText>
              <ThemedText style={styles.infoValue}>{user.displayName || user.email?.split("@")[0] || "Belirtilmemiş"}</ThemedText>
            </View>
          </View>
        </View>
      </ThemedCard>

      {/* Dil Seçeneği */}
      <ThemedCard
        style={[styles.settingsCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionTitle}>Dil Seçeneği</ThemedTitle>

        <View style={styles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                { 
                  backgroundColor: selectedLanguage === lang.code ? "#2E7D32" : theme.fourthBg,
                  borderColor: selectedLanguage === lang.code ? "#2E7D32" : "#999",
                },
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
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
        <ThemedTitle style={styles.sectionTitle}>Hesap İşlemleri</ThemedTitle>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.primary }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#000" />
          <ThemedText style={styles.logoutButtonText}>Çıkış Yap</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.danger }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={22} color={theme.danger} />
          <ThemedText style={[styles.deleteButtonText, { color: theme.danger }]}>
            Hesabı Sil
          </ThemedText>
        </TouchableOpacity>
      </ThemedCard>

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
});
