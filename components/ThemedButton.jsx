import React, { useState } from "react";
import { Pressable, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

const ThemedButton = ({
  title,
  onPress,
  style,
  textStyle,
  stayPressed = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const [active, setActive] = useState(false);

  const handlePress = (event) => {
    if (stayPressed) setActive(true);
    if (onPress) onPress(event);
  };

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: theme.thirdBg },
        (active || props.pressed) && styles.pressed,
        style,
      ]}
      onPress={handlePress}
      {...props}
    >
      <Text style={[styles.text, { color: theme.background }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

export default ThemedButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pressed: {
    opacity: 0.75,
  },
});
