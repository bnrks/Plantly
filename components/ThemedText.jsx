import { Text } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";

const ThemedText = ({ style, color, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  
  // Props olarak renk gelmezse tema bazlı varsayılan renk
  // Dark modda açık (title/krem), Light modda koyu (title/orman yeşili)
  const defaultColor = theme.title;
  const textColor = color || defaultColor;

  // Ensure children is never undefined/null to prevent render errors
  const safeChildren = children ?? "";

  return (
    <Text
      style={[
        {
          fontSize: 17,
          alignSelf: "flex-start",
          fontFamily: "CommeRegular",
          color: textColor,
        },
        style,
      ]}
      {...props}
    >
      {safeChildren}
    </Text>
  );
};

export default ThemedText;
