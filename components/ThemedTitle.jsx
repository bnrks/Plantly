import { StyleSheet, Text, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../app/context/ThemeContext";
const ThemedTitle = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <Text
      style={[{ color: theme.title, fontSize: 24, fontWeight: "bold" }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemedTitle;
