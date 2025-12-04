import { useState, useContext } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { signin, signInWithGoogle } from "../../src/services/authService";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { Colors } from "../../constants/Colors";
import { ThemeContext } from "../../src/context/ThemeContext";
import ThemedTextInput from "../../components/ThemedTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return t("auth.invalidEmail");
      case "auth/user-not-found":
        return t("auth.userNotFound");
      case "auth/wrong-password":
        return t("auth.wrongPassword");
      case "auth/invalid-credential":
        return t("auth.invalidCredential");
      case "auth/too-many-requests":
        return t("auth.tooManyRequests");
      case "auth/user-disabled":
        return t("auth.userDisabled");
      default:
        return t("auth.loginError");
    }
  };

  const handleLogin = async () => {
    setError("");
    
    if (!email.trim()) {
      setError(t("auth.enterEmail"));
      return;
    }
    if (!password) {
      setError(t("auth.enterPassword"));
      return;
    }

    try {
      setIsLoading(true);
      await signin(email.trim(), password);
      console.log("Giriş başarılı");
      router.replace("/home");
    } catch (error) {
      console.log("Login error:", error.code);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await signInWithGoogle();
      console.log("Google ile giriş başarılı", result);
      
      // Profil tamamlanmamışsa yönlendir
      if (!result.profileComplete) {
        const userId = result.userCredential.user.uid;
        
        if (result.missingFields.includes('displayName')) {
          // Önce username sayfasına
          router.replace({
            pathname: "/enterUsername",
            params: { userId: userId }
          });
        } else if (result.missingFields.includes('name')) {
          // Sadece name eksikse name sayfasına
          router.replace({
            pathname: "/enterName",
            params: { userId: userId }
          });
        } else {
          router.replace("/home");
        }
      } else {
        router.replace("/home");
      }
    } catch (error) {
      if (error.code !== "auth/cancelled") {
        console.error("Google sign-in error:", error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          style={styles.container}
          colors={
            selectedTheme === "dark"
              ? ["#2D3D34", "#243029", "#1A2420"]
              : ["#A8E6CF", "#DCEDC1", "#FFFFFF"]
          }
          start={{ x: 0, y: 0.001 }}
          end={{ x: 0, y: 1 }}
        >
          <Image
            source={require("../../assets/plantly-logo.png")}
            style={styles.logo}
          />

          <ThemedCard
            style={{
              height: "47%",
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
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Şifre girişi */}
            <ThemedTextInput
              style={{
                width: "90%",
                marginBottom: error ? 10 : 20,
                borderRadius: 5,
                height: 50,
              }}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError("");
              }}
              secureTextEntry
            />

            {/* Error message */}
            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            {/* Giriş butonu */}
            <ThemedButton
              title={isLoading ? t('auth.signingIn') : t('auth.loginButton')}
              style={{
                height: 50,
                borderRadius: 5,
                backgroundColor: Colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleLogin}
              textStyle={styles.buttonText}
              stayPressed={true}
              disabled={isLoading}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.tertiaryText }]} />
              <ThemedText style={styles.dividerText}>{t('auth.or')}</ThemedText>
              <View style={[styles.divider, { backgroundColor: theme.tertiaryText }]} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/google-icon.png")}
                style={styles.googleIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Link href={"/register"} style={[styles.linkText, { color: theme.title }]}>
                {t('auth.dontHaveAccount')}
              </Link>
            </TouchableOpacity>
            <TouchableOpacity style={{ ...styles.button, marginTop: 20 }}>
              <Link href={"/resetPassword"} style={[styles.linkText, { color: theme.title }]}>
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
    
  },
  logo: {
    width: 300,
    height: 300,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: "#888",
  },
  googleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#dadce0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    width: "90%",
  },
  button: {
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
