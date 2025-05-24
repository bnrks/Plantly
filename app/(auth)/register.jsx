import React, { useState, useContext } from "react";
import { StyleSheet, Alert, Image } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
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
        <ThemedText
          style={
            (styles.title,
            {
              alignSelf: "center",
              fontSize: 30,
              paddingBottom: 20,
              fontWeight: "bold",
              marginBottom: 20,
            })
          }
        >
          Kayıt Ol
        </ThemedText>

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
          style={{
            height: 50,
            borderRadius: 5,
            backgroundColor: theme.fourthBg,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
          onPress={handleRegister}
          textStyle={styles.buttonText}
          stayPressed={true}
        />

        <Link href="/login" style={[styles.link, styles.buttonText]}>
          <ThemedText>Hesabın var mı? Giriş yap</ThemedText>
        </Link>
      </ThemedCard>
    </LinearGradient>
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
    color: "#000000",
  },
  link: {
    marginTop: 10,
  },
  logo: {
    width: 300,
    height: 300,
  },
});
