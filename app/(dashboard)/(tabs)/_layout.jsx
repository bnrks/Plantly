// app/(dashboard)/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../../../src/context/ThemeContext";
export default function DashboardTabs() {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.secondBg,
        tabBarInactiveTintColor: theme.text,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          height: 63,
          borderRadius: 30,
          borderTopWidth: 0,
          marginHorizontal: 10,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.thirdBg,
          alignSelf: "center",
          justifyContent: "center",
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="myPlants"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="leaf-outline" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="addPlant"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
