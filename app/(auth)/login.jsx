import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  useColorScheme,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { signin } from "../../src/services/authService";
import PlantlyLogo from "../../assets/plantly-logo.png";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const handleLogin = async () => {
    try {
      await signin(email.trim(), password);
      console.log("Giriş başarılı");
      router.replace("/home");
    } catch (error) {}
    console.log("Giriş yapılıyor:", email, password);
  };

  return (
    <ThemedView style={styles.container}>
      <Image source={PlantlyLogo} style={styles.logo} resizeMode="contain" />

      <ThemedText
        style={
          (styles.title,
          {
            fontFamily: "Martian Mono",
            fontSize: 50,
            fontWeight: "bold",
            alignSelf: "center",
            justifyContent: "center",
            marginBottom: 70,
            marginTop: -20,
          })
        }
      >
        Plantly
      </ThemedText>
      <ThemedCard
        style={{
          height: "45%",
          width: "100%",
          marginTop: 10,
          borderRadius: 20,
          padding: 20,
          alignItems: "center",
        }}
      >
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
          Giriş Yap
        </ThemedText>

        {/* E-posta girişi */}
        <ThemedTextInput
          style={{
            width: "90%",
            marginBottom: 20,
            borderRadius: 5,
            height: 50,
          }}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Şifre girişi */}
        <ThemedTextInput
          style={{
            width: "90%",
            marginBottom: 20,
            borderRadius: 5,
            height: 50,
          }}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Giriş butonu */}
        <ThemedButton
          title="Giriş"
          style={{
            height: 50,
            borderRadius: 5,
            backgroundColor: theme.primary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
          onPress={handleLogin}
          textStyle={styles.buttonText}
          stayPressed={true}
        />

        <TouchableOpacity style={styles.button}>
          <Link href={"/register"} style={styles.buttonText}>
            Hesabın Yok Mu? Kayıt Ol
          </Link>
        </TouchableOpacity>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ekranın tamamını kapla
    justifyContent: "center", // Yatayda ortala
    alignItems: "center", // Dikeyde ortala
    padding: 10,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logo: {
    width: 250,
    height: 250,
  },
});
