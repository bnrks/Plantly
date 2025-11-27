import React, { useState, useContext } from "react";
import { StyleSheet, Image } from "react-native";
import { useRouter, Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { signup } from "../../src/services/authService";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useCustomAlert } from "../../src/hooks/ui/useCustomAlert";
export default function Register() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { alertConfig, showSuccess, showError, showWarning, hideAlert } =
    useCustomAlert();

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const handleRegister = async () => {
    if (!email.trim()) {
      showWarning(t('common.error'), t('auth.enterEmail'));
      return;
    }
    if (password.length < 6) {
      showWarning(t('common.error'), t('auth.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      showWarning(t('common.error'), t('auth.passwordsNotMatch'));
      return;
    }
    try {
      const userCredential = await signup(email.trim(), password);
      const userId = userCredential.user.uid;
      showSuccess(t('common.success'), t('auth.registrationSuccess'), () => {
        hideAlert();
        router.replace({
          pathname: "/enterUsername",
          params: { userId: userId }
        });
      });
    } catch (e) {
      showError(t('common.error'), e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
              {t('auth.register')}
            </ThemedText>

            <ThemedTextInput
              style={styles.input}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ThemedTextInput
              style={styles.input}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <ThemedTextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <ThemedButton
              title={t('auth.registerButton')}
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
              <ThemedText>{t('auth.alreadyHaveAccount')}</ThemedText>
            </Link>
          </ThemedCard>
        </LinearGradient>

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
      </ScrollView>
    </KeyboardAvoidingView>
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
