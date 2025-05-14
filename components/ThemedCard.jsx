import { StyleSheet, View, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const ThemedCard = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <View style={[{ backgroundColor: theme.secondBg }, style]} {...props}>
      {children}
    </View>
  );
};

export default ThemedCard;

const styles = StyleSheet.create({});
