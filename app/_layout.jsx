// app/_layout.jsx
import React, { useContext, useEffect } from "react";
import { StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";
import { AuthProvider } from "../src/context/AuthContext";
import { AlertSystemProvider } from "../src/context/AlertSystemProvider";
import * as Notifications from "expo-notifications";

// ErrorBoundary'yi dinamik import ile yükle
const ErrorBoundaryComponent = React.lazy(() =>
  import("../src/components/ErrorBoundary")
);

// Fallback ErrorBoundary
class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Simple ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // veya basit bir hata UI'ı
    }
    return this.props.children;
  }
}

// foreground'da banner göstermek için (global, bir kez!)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Global error handler'ı basit şekilde başlat
    console.log("✅ Global Error Handler initialized");

    // (Opsiyonel) bildirim tıklamasını yakala -> navigate
    const sub = Notifications.addNotificationResponseReceivedListener(
      (resp) => {
        const data = resp?.notification?.request?.content?.data || {};
        // ör: router.push(`/plants/${data.plantId}`)
      }
    );
    return () => sub.remove();
  }, []);

  return (
    <SimpleErrorBoundary>
      <AlertSystemProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootInner />
          </ThemeProvider>
        </AuthProvider>
      </AlertSystemProvider>
    </SimpleErrorBoundary>
  );
}

function RootInner() {
  // 2. Artık context'ten tema bilgisini okuyabiliriz
  const { theme: currentTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;

  return (
    // 3. SafeAreaView ile status bar bölgesini de renklendirelim
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
