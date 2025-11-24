// components/PlantCard.js
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../constants/Colors";
import ThemedTitle from "./ThemedTitle";
import ThemedText from "./ThemedText";
import { useContext } from "react";
import { ThemeContext } from "../src/context/ThemeContext";
const PlantCard = ({ name, description, image, onPress, style }) => {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* SOLDAKİ RESİM */}
      <Image source={image} style={styles.image} />

      {/* SAĞDA İSİM + AÇIKLAMA */}
      <View style={styles.textContainer}>
        <ThemedTitle style={[styles.name, { color: theme.title }]}>
          {name}
        </ThemedTitle>
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
    padding: 12, // Increased padding
    marginVertical: 6,
    borderRadius: 12,
  },
  image: {
    width: 100, // Doubled width
    height: 100, // Doubled height
    borderRadius: 8,
    marginRight: 20, // Adjusted margin
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 2,
  },
  description: {
    fontSize: 15,
  },
});
