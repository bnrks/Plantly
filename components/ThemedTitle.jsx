import { Text } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const ThemedTitle = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  // Ensure children is never undefined/null to prevent render errors
  const safeChildren = children ?? "";

  return (
    <Text
      style={[
        {
          color: theme.title,
          fontSize: 24,
          fontFamily: "CommeRegular",
          fontWeight: "700",
        },
        style,
      ]}
      {...props}
    >
      {safeChildren}
    </Text>
  );
};

export default ThemedTitle;
