import { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";

const ThemedButton = ({
  title,
  onPress,
  style,
  textStyle,
  textColor,
  stayPressed = false,
  ...props
}) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const [active, setActive] = useState(false);
  
  // Props olarak renk gelmezse tema bazlı varsayılan renk
  // Dark modda açık, Light modda koyu
  const isDark = selectedTheme === "dark";
  const defaultTextColor = isDark ? "#F5F2ED" : "#1E3A29";
  const buttonTextColor = textColor || defaultTextColor;

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
      <Text
        style={[
          styles.text,
          { color: buttonTextColor, fontFamily: "CommeRegular" },
          textStyle,
        ]}
      >
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
