import { StyleSheet, View } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const ThemedCard = ({ style, children, ...props }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <View
      style={[
        {
          backgroundColor: theme.secondBg,
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: "auto",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default ThemedCard;

const styles = StyleSheet.create({});
