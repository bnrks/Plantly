// app/(dashboard)/_layout.jsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.secondBg,
        tabBarInactiveTintColor: theme.text,

        tabBarStyle: {
          position: "absolute",
          bottom: 10,
          left: 20,
          right: 20,
          height: 63,
          borderRadius: 30,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.thirdBg,
          width: "100%",
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home" // app/(dashboard)/home.jsx
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={30} color={color} />
          ),
        }}
      />

      {/* Bitkilerim */}
      <Tabs.Screen
        name="myPlants" // app/(dashboard)/myplants.jsx
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={30} color={color} />
          ),
        }}
      />

      {/* Ayarlar */}
      <Tabs.Screen
        name="settings" // app/(dashboard)/settings.jsx
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
