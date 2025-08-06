import { Text } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const ThemedText = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <Text
      style={[{ color: theme.text, fontSize: 17, alignSelf: "start" }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemedText;
