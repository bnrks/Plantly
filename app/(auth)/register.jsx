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
import { Link } from "expo-router";
import PlantlyLogo from "../../assets/plantly-logo.png";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const handleLogin = () => {
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
            marginBottom: 50,
            marginTop: -20,
          })
        }
      >
        Plantly
      </ThemedText>
      <ThemedCard
        style={{
          height: "55%",
          width: "100%",
          marginTop: 10,
          borderRadius: 20,
          padding: 20,
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
            })
          }
        >
          Kayıt Ol
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {/* E-posta girişi */}
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Şifre girişi */}
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {/* Şifre girişi */}
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Giriş butonu */}
        <ThemedButton
          title="Giriş"
          onPress={handleLogin}
          style={styles.button}
          textStyle={styles.buttonText}
          stayPressed={true}
        />

        <TouchableOpacity style={styles.button}>
          <Link href={"/loginscreen"} style={styles.buttonText}>
            Zaten Hesabım Var? Giriş Yap
          </Link>
        </TouchableOpacity>
      </ThemedCard>
    </ThemedView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ekranın tamamını kapla
    justifyContent: "center", // Yatayda ortala
    alignItems: "center", // Dikeyde ortala
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
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
