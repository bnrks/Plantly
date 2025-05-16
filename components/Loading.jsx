import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React from "react";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";

const Loading = ({ style, children, ...props }) => {
  return (
    <ThemedView style={[styles.center, style]} {...props}>
      <ActivityIndicator size="large" />
      <ThemedText style={styles.loadingText}>{children}</ThemedText>
    </ThemedView>
  );
};

export default Loading;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 16, // spinner’ın hemen altına biraz boşluk
    textAlign: "center", // metni ortala
    fontSize: 22,
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
