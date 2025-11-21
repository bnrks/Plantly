import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";

const ScreenContainer = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  paddingHorizontal = 20,
  topSpacing = 16,
  bottomSpacing = 40,
}) => {
  const insets = useSafeAreaInsets();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const baseStyle = {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal,
    paddingTop: topSpacing + insets.top,
  };

  const bottomPadding = bottomSpacing + insets.bottom;

  if (scrollable) {
    return (
      <View style={[baseStyle, style]}>
        <ScrollView
          contentContainerStyle={[
            { paddingBottom: bottomPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[baseStyle, { paddingBottom: bottomPadding }, style]}>
      {children}
    </View>
  );
};

export default ScreenContainer;
