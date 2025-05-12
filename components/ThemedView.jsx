import { StyleSheet, Text, View, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../app/context/ThemeContext";
const ThemedView = ({ style, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  console.log("Current theme:", theme);
  return (
    <View
      style={[{ flex: 1, backgroundColor: theme.background }, style]}
      {...props}
    ></View>
  );
};

export default ThemedView;

const styles = StyleSheet.create({});
