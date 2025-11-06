import { useContext, useMemo } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import BackButton from "../../../components/BackButton";

const { width } = Dimensions.get("window");

const MODULES = [
  {
    id: "starter",
    title: "Baslangic Rehberi",
    description:
      "Temel bitki bakimi prensipleri ve baslayanlar icin gunluk rutinler.",
    duration: "15 dk",
    image: require("../../../assets/onboarding-1.png"),
  },
  {
    id: "watering",
    title: "Sulama Akademisi",
    description:
      "Toprak nemini dogru okuma, su kalitesi ve mevsimsel sulama taktikleri.",
    duration: "10 dk",
    image: require("../../../assets/onboarding-2.png"),
  },
  {
    id: "light",
    title: "Isik Uzmani",
    description: "Bitkileriniz icin dogru konumu secin, yapay isikla destekleyin.",
    duration: "12 dk",
    image: require("../../../assets/onboarding-3.png"),
  },
  {
    id: "diagnosis",
    title: "Hastalik Dedektifi",
    description: "Yaprak lekelerini analiz ederek erken teshis yapmayi ogrenin.",
    duration: "18 dk",
    image: require("../../../assets/onboarding-4.png"),
  },
  {
    id: "seasonal",
    title: "Mevsimsel Hazirlik",
    description: "Gecis donemleri icin bakim, budama ve ortam kontrol listeleri.",
    duration: "9 dk",
    image: require("../../../assets/header.png"),
  },
];

export default function EducationScreen() {
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const accentColor = useMemo(
    () => (selectedTheme === "dark" ? theme.title : theme.thirdBg),
    [selectedTheme, theme]
  );

  const cardWidth = useMemo(() => width - 32, []);

  const handleModulePress = (moduleId) =>
    router.push({
      pathname: "/(dashboard)/education/module",
      params: { id: moduleId },
    });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <BackButton />
      </View>

      <View style={styles.hero}>
        <View
          style={[
            styles.heroBadge,
            {
              backgroundColor:
                selectedTheme === "dark"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(83,115,84,0.15)",
            },
          ]}
        >
          <Ionicons name="school-outline" size={22} color={accentColor} />
        </View>
        <ThemedTitle style={styles.heroTitle}>Egitim Kutuphanesi</ThemedTitle>
        <ThemedText style={[styles.heroSubtitle, { color: theme.text }]}>
          Her seviyeden bitki sever icin hazirlanan modulleri kesfet, bilgin tazelensin.
        </ThemedText>
      </View>

      <FlatList
        data={MODULES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 32, alignItems: "center" },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleModulePress(item.id)}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: theme.secondBg,
                  borderColor:
                    selectedTheme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.06)",
                  shadowColor: selectedTheme === "dark" ? "#050505" : "#000000",
                },
              ]}
            >
              <Image source={item.image} style={styles.cardImage} />

              <View style={styles.cardBottom}>
                <View style={styles.cardTextWrapper}>
                  <ThemedTitle style={styles.cardTitle}>
                    {item.title}
                  </ThemedTitle>
                  <ThemedText
                    style={[styles.cardDescription, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </ThemedText>
                </View>

                <View style={styles.durationTag}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={accentColor}
                    style={{ marginRight: 4 }}
                  />
                  <ThemedText style={[styles.durationText, { color: accentColor }]}>
                    {item.duration}
                  </ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  hero: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  listContent: {
    paddingTop: 8,
    gap: 18,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 18,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardBottom: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardTextWrapper: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  durationTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(83,115,84,0.12)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
