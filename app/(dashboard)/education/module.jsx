import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import BackButton from "../../../components/BackButton";
import ScreenContainer from "../../../components/ScreenContainer";
import TipTapRenderer from "../../../components/TipTapRenderer";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import EducationModuleSkeleton from "../../../components/skeletons/EducationModuleSkeleton";
import { fetchEducationModuleById } from "../../../src/services/firestoreService";

export default function EducationModuleScreen() {
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
        const data = await fetchEducationModuleById(moduleId);

        if (data) {
          setModuleData({
            id: data.id,
            title: data.moduleName || "Eğitim Modülü",
            content: data.content,
            banner: data.bannerLink ? { uri: data.bannerLink } : null,
          });
        } else {
          setModuleData({
            title: "Modül bulunamadı",
            content: null,
            banner: null,
          });
        }
      } catch (error) {
        console.warn("Modül verisi çekilirken hata:", error);
        setModuleData({
          title: "Bir hata oluştu",
          content: null,
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

  const hasContent =
    moduleData.content &&
    (typeof moduleData.content === "string" ||
      (moduleData.content.type === "doc" &&
        Array.isArray(moduleData.content.content) &&
        moduleData.content.content.length > 0));

  return (
    <ScreenContainer style={styles.screen}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <BackButton />
      </View>

      {/* Main Card */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: theme.secondBg,
            borderColor:
              selectedTheme === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner */}
          {moduleData.banner && (
            <Image source={moduleData.banner} style={styles.bannerImage} />
          )}

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor:
                    selectedTheme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(83,115,84,0.12)",
                },
              ]}
            >
              <Ionicons name="book" size={24} color={accent} />
            </View>
            <ThemedTitle style={styles.title}>{moduleData.title}</ThemedTitle>
            <View
              style={[styles.divider, { backgroundColor: accent + "30" }]}
            />
          </View>

          {/* Content */}
          {hasContent ? (
            <View style={styles.contentSection}>
              <TipTapRenderer content={moduleData.content} />
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons
                name="document-text-outline"
                size={56}
                color={theme.text + "30"}
              />
              <ThemedText style={styles.emptyText}>
                Bu modül için içerik henüz eklenmemiş.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mainCard: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  bannerImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: "center",
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 8,
  },
  divider: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 16,
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptySection: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.5,
    marginTop: 16,
  },
});
