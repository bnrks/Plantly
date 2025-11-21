import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import BackButton from "../../../components/BackButton";
import Header from "../../../components/Header";
import ScreenContainer from "../../../components/ScreenContainer";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import EducationModuleSkeleton from "../../../components/skeletons/EducationModuleSkeleton";
import { fetchEducationModules } from "../../../src/services/firestoreService";

const fallbackDescriptions = {
  starter: "Bitki bakiminin temel adimlarini ogrenmek icin hazirlanan ozet.",
  watering: "Sulama sikligi, su kalitesi ve toprak nemini izleme ipuclari.",
  light: "Bitkiler icin dogru konumlandirma ve yapay isik kullanimi.",
  diagnosis: "Yaprak, govde ve kok belirtilerinden yola cikarak erken teshis.",
  seasonal: "Mevsim gecislerinde yapilacak bakim, budama ve ortam ayarlari.",
};

export default function EducationModuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const [loading, setLoading] = useState(true);
  const [moduleData, setModuleData] = useState(null);

  const moduleId = params.id ?? "starter";

  const accent = useMemo(
    () => (selectedTheme === "dark" ? theme.title : theme.thirdBg),
    [selectedTheme, theme]
  );

  useEffect(() => {
    const loadModule = async () => {
      try {
        const modules = await fetchEducationModules();
        const current =
          modules?.find((m) => m.id === moduleId) ||
          modules?.find((m) => m.moduleName === moduleId);

        if (current) {
          setModuleData({
            title: current.moduleName || "Egitim Modulu",
            description:
              current.content ||
              fallbackDescriptions[moduleId] ||
              "Bu modul icin ayrintilar yakinda eklenecek.",
            banner: current.bannerLink ? { uri: current.bannerLink } : null,
          });
        } else {
          setModuleData({
            title: "Egitim materyalleri yakinda",
            description:
              fallbackDescriptions[moduleId] ||
              "Bu modul icin ayrintilar yakinda eklenecek. Simdilik ozet bilgileri inceleyebilirsin.",
            banner: null,
          });
        }
      } catch (error) {
        console.warn("Modul verisi cekilirken hata:", error);
        setModuleData({
          title: "Egitim materyalleri yakinda",
          description:
            fallbackDescriptions[moduleId] ||
            "Modul icerigini hazirliyoruz. Su an icin ozet bilgileri inceleyebilirsin.",
          banner: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleId]);

  if (loading) {
    return <EducationModuleSkeleton />;
  }

  if (!moduleData) {
    return null;
  }

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <BackButton />
      </View>
      {moduleData.banner ? (
        <Image source={moduleData.banner} style={styles.bannerImage} />
      ) : (
        <Header style={styles.headerImage} />
      )}

      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.secondBg,
            borderColor:
              selectedTheme === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <Ionicons
          name="book-outline"
          size={44}
          color={accent}
          style={{ marginBottom: 12 }}
        />
        <ThemedTitle style={styles.heroTitle}>
          {moduleData.title || "Egitim materyalleri yakinda"}
        </ThemedTitle>
        <ThemedText
          style={[styles.heroSubtitle, { color: theme.text }]}
          numberOfLines={0}
        >
          {moduleData.description}
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
        <ThemedText
          style={[styles.cardText, { color: theme.text }]}
          numberOfLines={0}
        >
          {moduleData.description}
        </ThemedText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  bannerImage: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    resizeMode: "cover",
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    alignItems: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
  },
  heroTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "left",
  },
  heroSubtitle: {
    textAlign: "justify",
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
    textAlign: "justify",
  },
});
