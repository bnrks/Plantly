import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import ThemedTitle from "./ThemedTitle";
import ThemedText from "./ThemedText";
import { Colors } from "../constants/Colors";

const HomeEducationCard = ({
  title,
  description,
  banner,
  onPress,
  themeName = "light",
}) => {
  const theme = Colors[themeName] ?? Colors.light;

  const imageSource =
    typeof banner === "string"
      ? { uri: banner }
      : banner || require("../assets/header.png");

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <Image source={imageSource} style={styles.image} />
      <View style={[styles.info, { backgroundColor: theme.secondBg }]}>
        <ThemedTitle style={styles.title}>{title}</ThemedTitle>
        <ThemedText style={[styles.desc, { color: theme.text }]} numberOfLines={2}>
          {description}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default HomeEducationCard;

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: 110,
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
  },
});
