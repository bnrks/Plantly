// app/_layout.jsx
import { useContext, useEffect } from "react";
import { StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";
import { AuthProvider } from "../src/context/AuthContext";
import ErrorBoundary from "../src/components/ErrorBoundary";
import { AlertSystemProvider } from "../src/context/AlertSystemProvider";
import * as Notifications from "expo-notifications";
import { initializeErrorHandlers } from "../src/services/index";

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
    // Error handlers'ı başlat
    initializeErrorHandlers();

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
    <ErrorBoundary name="App" level="app">
      <AlertSystemProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootInner />
          </ThemeProvider>
        </AuthProvider>
      </AlertSystemProvider>
    </ErrorBoundary>
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
