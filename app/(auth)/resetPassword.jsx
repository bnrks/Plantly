import { useState } from "react";
import { StyleSheet, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { resetPassword } from "../../src/services/authService";
const ResetPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const result = await resetPassword(email.trim());
      if (result.success) {
        console.log("Şifre sıfırlama linki gönderildi");
        setResetSuccess(true);
      } else {
        console.error("Şifre sıfırlama hatası:", result.code);
      }
    } catch (error) {
      console.error("Beklenmeyen bir hata oluştu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          {t('auth.resetPassword')}
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
          editable={!resetSuccess}
        />

        <ThemedButton
          title={resetSuccess ? t('common.done') : t('auth.resetPasswordButton')}
          style={{
            height: 50,
            borderRadius: 5,
            backgroundColor: resetSuccess
              ? theme.disabledButton || "#ccc"
              : Colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
          onPress={handleResetPassword}
          textStyle={styles.buttonText}
          stayPressed={true}
          disabled={isLoading || resetSuccess}
        />

        <TouchableOpacity style={styles.button}>
          <Link href={"/register"} style={styles.buttonText}>
            {t('auth.dontHaveAccount')}
          </Link>
        </TouchableOpacity>
        <TouchableOpacity style={{ ...styles.button, marginTop: 20 }}>
          <Link href={"/login"} style={styles.buttonText}>
            {t('auth.login')}
          </Link>
        </TouchableOpacity>
      </ThemedCard>
    </LinearGradient>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ekranın tamamını kapla
    alignItems: "center", // Dikeyde ortala
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
