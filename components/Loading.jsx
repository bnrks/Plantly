import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Image, Animated } from "react-native";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import PlantlyThinking from "../assets/plantly-thinking.png";
const Loading = ({ style, children, ...props }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Giriş animasyonu
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <ThemedView style={[styles.container, style]} {...props}>
        <Image
          source={require("../assets/loading-gif.gif")}
          style={styles.loadingGif}
        />
        <Image
          source={require("../assets/plantly-thinking.png")}
          style={styles.assistant}
        />
      </ThemedView>
    </Animated.View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Daha koyu overlay
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "transparent",
  },

  loadingGif: {
    width: 120,
    height: 120,
  },
  assistant: {
    width: 40,
    height: 40,
    top: -80,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
});
