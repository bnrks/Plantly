import { StyleSheet, Text, View, useColorScheme } from "react-native";
import React from "react";
import { Slot, Stack } from "expo-router"; // Slot bileşenini içe aktar

const RootLayout = () => {
  const colorScheme = useColorScheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Ana sayfa / splash / yönlendirme */}
      <Stack.Screen name="index" />

      {/* Authentication */}
      <Stack.Screen name="(auth)" />

      {/* Dashboard → içine girince tabları gösterir */}
      <Stack.Screen name="(dashboard)" />
    </Stack>
  );
};

export default RootLayout;

const styles = StyleSheet.create({});
