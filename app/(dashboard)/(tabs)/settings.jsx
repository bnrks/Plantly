import { useContext } from "react";
import { StyleSheet, View, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import { AuthContext } from "../../../src/context/AuthContext";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../src/hooks/ui/useCustomAlert";

export default function Settings() {
  const router = useRouter();
  const { theme: currentTheme, toggleTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;
  const { user, logout } = useContext(AuthContext);
  const { alertConfig, showSuccess, showError, hideAlert } = useCustomAlert();

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

  return (
    <ThemedView style={styles.container}>
      <ThemedCard
        style={{ padding: 20, height: "70%", borderRadius: 20, marginTop: 40 }}
      >
        <ThemedTitle style={styles.header}>Ayarlar</ThemedTitle>

        {/* Tema Değiştirme */}
        <View style={[styles.section, { backgroundColor: theme.secondaryBg }]}>
          <ThemedText style={styles.sectionText}>Koyu Mod</ThemedText>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={currentTheme === "dark" ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={currentTheme === "dark"}
          />
        </View>

        {/* Çıkış Butonu */}
        <View style={styles.section}>
          <ThemedButton
            title="Çıkış Yap"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionText: {
    fontSize: 16,
  },
  logoutButton: {
    width: "100%",
  },
});
