import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useContext, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useTranslation } from "react-i18next";

import ThemedCard from "../../../components/ThemedCard";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Header from "../../../components/Header";
import ScreenContainer from "../../../components/ScreenContainer";
import HomeSkeleton from "../../../components/skeletons/HomeSkeleton";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import { fetchPlantsForWatering, updatePlantWatering, fetchEducationModules, fetchUserProfileWithFavorite } from "../../../src/services/firestoreService";
import { registerForPush } from "../../../src/notifications/registerForPush";
import HomePlantCard from "../../../components/HomePlantCard";
import HomeEducationCard from "../../../components/HomeEducationCard";

/**
 * TipTap JSON content'inden plain text özet çıkarır
 */
function extractTextFromContent(content, maxLength = 80) {
  if (!content) return "";
  if (typeof content === "string") {
    return content.length > maxLength ? content.substring(0, maxLength) + "..." : content;
  }
  if (content.type === "doc" && Array.isArray(content.content)) {
    const texts = [];
    const extractText = (node) => {
      if (!node) return;
      if (node.type === "text" && node.text) texts.push(node.text);
      if (Array.isArray(node.content)) node.content.forEach(extractText);
    };
    content.content.forEach(extractText);
    const fullText = texts.join(" ").trim();
    return fullText.length > maxLength ? fullText.substring(0, maxLength) + "..." : fullText;
  }
  return "";
}

const Home = () => {
  const { t } = useTranslation();
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);
  const router = useRouter();
  const notificationCount = plantss.length;
  const fallbackModules = [
    {
      id: "starter",
      moduleName: "Baslangic Rehberi",
      content: "Temel bakim ipuclari.",
      bannerLink: "../../../assets/onboarding-1.png",
    },
    {
      id: "watering",
      moduleName: "Sulama Akademisi",
      content: "Sulama ve nem kontrolu.",
      bannerLink: "../../../assets/onboarding-2.png",
    },
    {
      id: "diagnosis",
      moduleName: "Hastalik Dedektifi",
      content: "Erken teshis ipuclari.",
      bannerLink: "../../../assets/onboarding-4.png",
    },
  ];
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const [username, setUsername] = useState("");
  const userid = user?.uid || "";
  const registeredRef = useRef(false);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    if (user?.uid && !registeredRef.current) {
      registeredRef.current = true;
      registerForPush(user.uid).catch(console.warn);
    }
  }, [user?.uid]);

  // Kullanıcı adını Firebase'den çek
  useEffect(() => {
    const fetchUserName = async () => {
      if (userid) {
        try {
          const userProfile = await fetchUserProfileWithFavorite(userid);
          if (userProfile?.name) {
            setUsername(userProfile.name);
          } else if (userProfile?.displayName) {
            setUsername(userProfile.displayName);
          } else {
            setUsername("Kullanıcı");
          }
        } catch (error) {
          console.error("Kullanıcı adı çekilirken hata:", error);
          setUsername(user?.displayName || "Kullanıcı");
        }
      }
    };
    fetchUserName();
  }, [userid]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  useEffect(() => {
    const getIdToken = async () => {
      if (user) {
        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            const idToken = await currentUser.getIdToken();
            console.log("Firebase ID Token:", idToken);
          }
        } catch (error) {
          console.error("idToken alma hatasi:", error);
        }
      }
    };
    getIdToken();
  }, [user]);

  useEffect(() => {
    if (user && !initialFetched && userid) {
      setLoading(true);
      fetchPlantsForWatering(userid, setPlantss, setLoading);
      setInitialFetched(true);
    }
  }, [user, userid, initialFetched]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await fetchEducationModules();
        const normalized =
          data && data.length > 0
            ? data.map((m) => ({
                id: m.id || String(Math.random()),
                title: String(m.moduleName || "Eğitim"),
                description: extractTextFromContent(m.content, 80),
                banner: m.bannerLink || null,
              }))
            : fallbackModules.map((m) => ({
                id: m.id,
                title: String(m.moduleName || ""),
                description: extractTextFromContent(m.content, 80),
                banner: m.bannerLink,
              }));
        setModules(normalized);
      } catch (error) {
        console.error("Egitimler yuklenirken hata:", error);
        const normalizedFallback = fallbackModules.map((m) => ({
          id: m.id,
          title: String(m.moduleName || ""),
          description: extractTextFromContent(m.content, 80),
          banner: m.bannerLink,
        }));
        setModules(normalizedFallback);
      }
    };

    loadModules();
  }, []);

  if (!user) return null;

  const handleWaterPlant = async (plantId) => {
    setPlantss((prev) => prev.filter((plant) => plant.id !== plantId));
    try {
      await updatePlantWatering(userid, plantId);
    } catch (e) {
      console.error("Sulama guncelleme hatasi:", e);
    }
  };

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <ScreenContainer
        scrollable
        contentContainerStyle={styles.homeContent}
        bottomSpacing={120}
      >
        <Header />

        <ThemedCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={{ width: "80%" }}>
              <ThemedTitle style={styles.summaryTitle}>
                {t('home.greeting', { name: username })}
              </ThemedTitle>
              <ThemedText>{t('home.notificationCount', { count: notificationCount })}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => alert(t('home.notifications'))}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={theme.title}
                />
                {notificationCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.warning }]}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.listCard}>
          <ThemedTitle style={styles.sectionTitle}>{t('home.myPlants')}</ThemedTitle>
          <ThemedText style={[styles.sectionDescription, { color: theme.secondaryText }]}>
            {t('home.wateringReminder')}
          </ThemedText>
          <FlatList
            data={plantss}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plantListHorizontal}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <HomePlantCard
                name={item.name}
                description={item.description}
                imageUrl={item.imageUrl}
                wateringLabel={item.lastWatered ? t('home.today') : "-"}
                themeName={selectedTheme}
                onPress={() =>
                  router.push({
                    pathname: "/plant/details",
                    params: { id: item.id },
                  })
                }
                onWaterPress={() => handleWaterPlant(item.id)}
              />
            )}
          />
        </ThemedCard>

        <ThemedCard style={styles.discoveryCard}>
          <View style={styles.discoveryHeader}>
            <ThemedTitle style={{ fontSize: 20 }}>{t('home.browseEducation')}</ThemedTitle>
            <TouchableOpacity
              onPress={() => router.push("/(dashboard)/education")}
            >
              <ThemedText style={[styles.linkText, { color: Colors.primary }]}>{t('home.seeAll')}</ThemedText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={modules}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.educationList}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <HomeEducationCard
                title={item.title}
                description={item.description}
                banner={item.banner}
                themeName={selectedTheme}
                onPress={() =>
                  router.push({
                    pathname: "/(dashboard)/education/module",
                    params: { id: item.id },
                  })
                }
              />
            )}
          />
        </ThemedCard>
      </ScreenContainer>
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  homeContent: {
    gap: 16,
  },
  summaryCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  notificationIcon: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  listCard: {
    borderRadius: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionDescription: {
    fontSize: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  plantList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  plantListHorizontal: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  educationList: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  discoveryCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  discoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  linkText: {
    fontWeight: "600",
  },
  trainingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  addButton: {
    marginTop: 16,
    marginBottom: 20,
  },
});
