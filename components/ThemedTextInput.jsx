import { TextInput, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
const ThemedTextInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const isLight = colorScheme === "light";
  
  return (
    <TextInput
      style={[
        {
          backgroundColor: theme.thirdBg,
          color: isLight ? "#F5F2ED" : theme.title,
          padding: 10,
          fontFamily: "CommeRegular",
        },
        style,
      ]}
      placeholderTextColor={isLight ? "#D4DED7" : theme.text}
      {...props}
    />
  );
};

export default ThemedTextInput;
