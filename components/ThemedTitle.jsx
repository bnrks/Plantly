import { StyleSheet, Text, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";

const ThemedTitle = ({ style, children, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

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
