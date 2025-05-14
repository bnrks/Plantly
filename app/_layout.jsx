// app/_layout.jsx
import React, { useContext } from "react";
import { StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";
import { AuthProvider } from "../src/context/AuthContext";
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootInner />
      </ThemeProvider>
    </AuthProvider>
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
