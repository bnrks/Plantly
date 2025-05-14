import React from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import ThemedView from "../../components/ThemedView";
import ThemedTitle from "../../components/ThemedTitle";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { useContext } from "react";
import { ThemeContext } from "../../src/context/ThemeContext";
export default function PlantDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  // TODO: Backend ile entegre edilecek => örnek veri
  const plant = {
    id,
    name: "Aloe Vera",
    description: "Güneşi sever, haftada 1 kez sulanmalı.",
    image: require("../../assets/aleo-vera.jpg"),
    wateringSchedule: [
      { day: "Pazartesi", time: "08:00" },
      { day: "Perşembe", time: "08:00" },
    ],
    fertilizing: [
      { month: "Mart", day: 15 },
      { month: "Eylül", day: 15 },
    ],
    status: "Sağlıklı",
    notes: "Yaprak altına spreyle nem uygulayın.",
  };

  return (
    <ThemedView style={styles.container}>
      {/* Sabit Header */}
      <View
        style={[
          styles.headerContainer,
          {
            position: "absolute",
            top: 10,
            left: -10,
            right: 0,
            zIndex: 1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={
            (styles.backButton,
            { backgroundColor: theme.secondBg, borderRadius: 50, padding: 10 })
          }
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ThemedCard
        style={{
          height: "90%",
          margin: 10,
          borderRadius: 20,
          marginTop: 30,
          paddingTop: 20,
        }}
      >
        {/* İçerik kaydırılabilir */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image source={plant.image} style={styles.image} />
          <ThemedTitle style={styles.title}>{plant.name}</ThemedTitle>

          <ThemedText style={styles.description}>
            {plant.description}
          </ThemedText>

          <ThemedTitle style={styles.sectionHeader}>Sulama Takvimi</ThemedTitle>
          {plant.wateringSchedule.map((item, idx) => (
            <ThemedText key={idx} style={styles.itemText}>
              {`${item.day} - ${item.time}`}
            </ThemedText>
          ))}

          <ThemedTitle style={styles.sectionHeader}>
            Gübreleme Takvimi
          </ThemedTitle>
          {plant.fertilizing.map((item, idx) => (
            <ThemedText key={idx} style={styles.itemText}>
              {`${item.month} ${item.day}`}
            </ThemedText>
          ))}

          <ThemedTitle style={styles.sectionHeader}>Notlar</ThemedTitle>
          <ThemedText style={styles.itemText}>{plant.notes}</ThemedText>

          <ThemedButton title="Analiz Et" style={styles.button} />
        </ScrollView>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 6,
  },
  button: {
    marginTop: 30,
  },
});
