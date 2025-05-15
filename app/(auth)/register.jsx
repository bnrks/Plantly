import React, { useState, useContext } from "react";
import { StyleSheet, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { signup } from "../../src/services/authService";
import PlantlyLogo from "../../assets/plantly-logo.png";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Şifreler eşleşmiyor!");
      return;
    }
    try {
      await signup(email.trim(), password, username.trim());
      Alert.alert("Başarılı", "Kayıt işlemi tamamlandı.");

      router.replace("/login");
    } catch (e) {
      Alert.alert("Hata", e.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Plantly</ThemedText>
      <ThemedCard style={styles.card}>
        <ThemedText style={styles.cardTitle}>Kayıt Ol</ThemedText>

        <ThemedTextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <ThemedTextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ThemedTextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <ThemedTextInput
          style={styles.input}
          placeholder="Şifre Tekrar"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <ThemedButton
          title="Kayıt Ol"
          onPress={handleRegister}
          style={[styles.button, { backgroundColor: theme.secondBg }]}
          textStyle={styles.buttonText}
        />

        <Link href="/login" style={styles.link}>
          <ThemedText>Hesabın var mı? Giriş yap</ThemedText>
        </Link>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontFamily: "Martian Mono",
    fontSize: 50,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 10,
  },
});
