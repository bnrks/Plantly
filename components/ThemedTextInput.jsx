import { TextInput, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
const ThemedTextInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  return (
    <TextInput
      style={[
        {
          backgroundColor: theme.thirdBg,
          color: theme.title,
          padding: 10,
          fontFamily: "CommeRegular",
        },
        style,
      ]}
      placeholderTextColor={theme.text}
      {...props}
    />
  );
};

export default ThemedTextInput;
