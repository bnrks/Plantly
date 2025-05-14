import React, { useContext } from "react";
import { StyleSheet, View, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";

export default function Settings() {
  const router = useRouter();
  const { theme: currentTheme, toggleTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;

  const handleLogout = () => {
    Alert.alert("Çıkış yapıldı");
    router.replace("/");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedCard
        style={{ padding: 20, height: "90%", borderRadius: 20, marginTop: 10 }}
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
