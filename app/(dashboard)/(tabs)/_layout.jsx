// app/(dashboard)/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Image, View } from "react-native";
export default function DashboardTabs() {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.secondBg,
        tabBarInactiveTintColor: theme.text,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 4,
          height: 70, // 63'ten 70'e çıkardık
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
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#537354", // Hafif arka plan rengi
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Image
                source={require("../../../assets/plantly-asistant.png")}
                style={{
                  width: focused ? 70 : 65, // Focused olduğunda biraz büyük
                  height: focused ? 70 : 65,
                }}
                resizeMode="contain"
              />
            </View>
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
