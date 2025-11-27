import { Text } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const ThemedText = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  // Ensure children is never undefined/null to prevent render errors
  const safeChildren = children ?? "";

  return (
    <Text
      style={[
        {
          fontSize: 17,
          alignSelf: "flex-start",
          fontFamily: "CommeRegular",
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
