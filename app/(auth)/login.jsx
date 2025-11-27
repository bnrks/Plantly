import { useState, useContext } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { signin } from "../../src/services/authService";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
import { LinearGradient } from "expo-linear-gradient";
export default function LoginScreen() {
  const { t } = useTranslation();
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          style={styles.container}
          colors={["#A8E6CF", "#DCEDC1", "#FFFFFF"]}
          start={{ x: 0, y: 0.001 }}
          end={{ x: 0, y: 1 }}
        >
          <Image
            source={require("../../assets/plantly-logo.png")}
            style={styles.logo}
          />

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
              {t('auth.login')}
            </ThemedText>

            {/* E-posta girişi */}
            <ThemedTextInput
              style={{
                width: "90%",
                marginBottom: 20,
                borderRadius: 5,
                height: 50,
              }}
              placeholder={t('auth.email')}
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
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Giriş butonu */}
            <ThemedButton
              title={t('auth.loginButton')}
              style={{
                height: 50,
                borderRadius: 5,
                backgroundColor: theme.fourthBg,
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
                {t('auth.dontHaveAccount')}
              </Link>
            </TouchableOpacity>
            <TouchableOpacity style={{ ...styles.button, marginTop: 20 }}>
              <Link href={"/resetPassword"} style={styles.buttonText}>
                {t('auth.forgotPassword')}
              </Link>
            </TouchableOpacity>
          </ThemedCard>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    alignItems: "center", 
    padding: 10,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  logo: {
    width: 400,
    height: 400,
  },
});
