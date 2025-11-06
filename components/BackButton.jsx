import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";

const BackButton = ({
  onPress,
  style,
  iconColor,
  backgroundColor,
  accessibilityLabel = "Geri don",
}) => {
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.back();
  };

  const defaultBackground =
    backgroundColor ??
    (selectedTheme === "dark"
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.06)");

  const defaultIconColor =
    iconColor ?? (selectedTheme === "dark" ? theme.title : theme.thirdBg);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: defaultBackground },
        pressed && styles.pressed,
        style,
      ]}
      onPress={handlePress}
    >
      <Ionicons name="chevron-back" size={22} color={defaultIconColor} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});

export default BackButton;
