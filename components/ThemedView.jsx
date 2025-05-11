import { StyleSheet, Text, View, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
const ThemedView = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
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
