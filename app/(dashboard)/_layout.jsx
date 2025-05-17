// app/(dashboard)/_layout.jsx
import React from "react";
import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Önce tüm tab’ları gösteren grup */}
      <Stack.Screen name="(tabs)" />

      {/* 2. Sonra detay ekranı */}
      <Stack.Screen name="plant/details" options={{ title: "Detay" }} />
    </Stack>
  );
}
