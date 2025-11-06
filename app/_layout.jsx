// app/_layout.jsx
import React, { useContext, useEffect } from "react";
import { StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { ThemeProvider, ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";
import { AuthProvider } from "../src/context/AuthContext";
import { AlertSystemProvider } from "../src/context/AlertSystemProvider";

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Simple ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    console.log("Global error handler initialized");

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Placeholder for navigation from notification payload
    });
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
  const { theme: currentTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;

  const [fontsLoaded, fontError] = useFonts({
    CommeRegular: require("../assets/fonts/Comme-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font yukleme hatasi:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.fontLoading]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <ActivityIndicator size="small" color="#537354" />
      </SafeAreaView>
    );
  }

  return (
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
  fontLoading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
