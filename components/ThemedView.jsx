import { StyleSheet, Text, View, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
import { SafeAreaView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ThemedView = ({ style, safe = false, ...props }) => {
  const insets = useSafeAreaInsets();

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  console.log("Current theme:", theme);
  if (!safe) {
    return (
      <View
        style={[{ flex: 1, backgroundColor: theme.background }, style]}
        {...props}
      ></View>
    );
  }
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...props}
    ></View>
  );
};

export default ThemedView;

const styles = StyleSheet.create({});
