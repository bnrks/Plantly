import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import BackButton from "../../../components/BackButton";
import Header from "../../../components/Header";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";

const moduleDescriptions = {
  starter:
    "Bitki bakiminin temel adimlarini ogrenmek icin hazirlanan ozet.",
  watering:
    "Sulama sikligi, su kalitesi ve toprak nemini izleme ipuclari.",
  light: "Bitkiler icin dogru konumlandirma ve yapay isik kullanimi.",
  diagnosis:
    "Yaprak, govde ve kok belirtilerinden yola cikarak erken teshis.",
  seasonal:
    "Mevsim gecislerinde yapilacak bakim, budama ve ortam ayarlari.",
};

export default function EducationModuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const moduleId = params.id ?? "starter";
  const description =
    moduleDescriptions[moduleId] ??
    "Bu modul icin ayrintilar yakinda eklenecek. Simdilik ozet bilgileri inceleyebilirsin.";

  const accent = useMemo(
    () => (selectedTheme === "dark" ? theme.title : theme.thirdBg),
    [selectedTheme, theme]
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <BackButton />
      </View>
      <Header style={styles.headerImage} />

      <View
        style={[
          styles.hero,
          {
            backgroundColor:
              selectedTheme === "dark"
                ? "rgba(255,255,255,0.12)"
                : theme.fourthBg,
          },
        ]}
      >
        <Ionicons
          name="book-outline"
          size={44}
          color={accent}
          style={{ marginBottom: 12 }}
        />
        <ThemedTitle style={styles.heroTitle}>Egitim materyalleri yakinda</ThemedTitle>
        <ThemedText style={[styles.heroSubtitle, { color: theme.text }]}>
          Modul iceriğini hazirliyoruz. Su an icin asagidaki ozetle calismaya baslayabilirsin.
        </ThemedText>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.secondBg,
            borderColor:
              selectedTheme === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <ThemedTitle style={styles.cardTitle}>Bu modulde neler var?</ThemedTitle>
        <ThemedText style={[styles.cardText, { color: theme.text }]}>
          {description}
        </ThemedText>

        <ThemedButton
          title="Bildirim al"
          onPress={() => router.push("/(dashboard)/(tabs)/chat")}
          style={[
            styles.notifyButton,
            {
              backgroundColor: accent,
            },
          ]}
          textStyle={{ color: theme.background }}
        />
      </View>
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
    marginBottom: 8,
  },
  headerImage: {
    marginTop: 0,
    marginBottom: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  notifyButton: {
    marginTop: 20,
  },
});
