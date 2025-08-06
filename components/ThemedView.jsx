import { StyleSheet, View } from "react-native";
import { Colors } from "../constants/Colors";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ThemedView = ({ style, safe = false, ...props }) => {
  const insets = useSafeAreaInsets();

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  if (!safe) {
    return (
      <View
        style={[{ flex: 1, backgroundColor: theme.background }, style]}
        {...props}
      ></View>
    );
  }
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...props}
    ></View>
  );
};

export default ThemedView;

const styles = StyleSheet.create({});
