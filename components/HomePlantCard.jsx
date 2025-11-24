import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedTitle from "./ThemedTitle";
import ThemedText from "./ThemedText";
import { Colors } from "../constants/Colors";

const HomePlantCard = ({
  name,
  description,
  imageUrl,
  wateringLabel,
  onPress,
  onWaterPress,
  themeName = "light",
}) => {
  const theme = Colors[themeName] ?? Colors.light;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={[styles.info, { backgroundColor: theme.secondBg }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <ThemedTitle style={styles.title}>{name}</ThemedTitle>
            <ThemedText style={[styles.desc, { color: theme.text }]}>
              {description}
            </ThemedText>
          </View>
          {onWaterPress ? (
            <TouchableOpacity
              onPress={onWaterPress}
              style={[styles.waterButton, { backgroundColor: theme.thirdBg }]}
              activeOpacity={0.85}
            >
              <Ionicons name="water" size={18} color="#ffffff" />
            </TouchableOpacity>
          ) : null}
        </View>
        <ThemedText style={[styles.watering, { color: theme.text }]}>
          Sulama: {wateringLabel}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default HomePlantCard;

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
    height: 120,
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
  },
  desc: {
    fontSize: 14,
    marginTop: 2,
  },
  watering: {
    fontSize: 13,
    fontWeight: "600",
  },
  waterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
