import React, { useContext, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../../src/context/ThemeContext";

const SkeletonBox = ({
  width = "100%",
  height = 16,
  borderRadius = 12,
  style,
}) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const baseColor =
    selectedTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const highlightColor =
    selectedTheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.18)";

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.box,
        { width, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export default SkeletonBox;

const styles = StyleSheet.create({
  box: {
    overflow: "hidden",
  },
});
