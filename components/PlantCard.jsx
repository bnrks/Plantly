// components/PlantCard.js
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "react-native";
import ThemedTitle from "./ThemedTitle";
import ThemedText from "./ThemedText";
const PlantCard = ({ name, description, image, onPress, style }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  return (
    <TouchableOpacity
      style={[styles.card, style, { backgroundColor: theme.fourthBg }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* SOLDAKİ RESİM */}
      <Image source={image} style={styles.image} />

      {/* SAĞDA İSİM + AÇIKLAMA */}
      <View style={styles.textContainer}>
        <ThemedTitle style={(theme.title, styles.name)}>{name}</ThemedTitle>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default PlantCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginVertical: 8,
    borderRadius: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});
