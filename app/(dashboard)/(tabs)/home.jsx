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

import ThemedCard from "../../../components/ThemedCard";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import PlantCard from "../../../components/PlantCard";
import Header from "../../../components/Header";
import ScreenContainer from "../../../components/ScreenContainer";
import HomeSkeleton from "../../../components/skeletons/HomeSkeleton";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import { fetchPlantsForWatering, updatePlantWatering } from "../../../src/services/firestoreService";
import { registerForPush } from "../../../src/notifications/registerForPush";

const Home = () => {
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);
  const router = useRouter();
  const notificationCount = plantss.length;
  const topTrainings = [
    { id: "starter", title: "Baslangic Rehberi", duration: "15 dk" },
    { id: "watering", title: "Sulama Akademisi", duration: "10 dk" },
    { id: "diagnosis", title: "Hastalik Dedektifi", duration: "18 dk" },
  ];
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const username = user?.displayName || "Kullanici";
  const userid = user?.uid || "";
  const registeredRef = useRef(false);

  useEffect(() => {
    if (user?.uid && !registeredRef.current) {
      registeredRef.current = true;
      registerForPush(user.uid).catch(console.warn);
    }
  }, [user?.uid]);

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
                Merhaba, {username}
              </ThemedTitle>
              <ThemedText>{notificationCount} tane bildirimin var.</ThemedText>
            </View>
            <TouchableOpacity onPress={() => alert("Bildirimler")}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={selectedTheme === "dark" ? theme.title : "#000000"}
                />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.listCard}>
          <ThemedTitle style={styles.sectionTitle}>Bitkilerim</ThemedTitle>
          <ThemedText style={styles.sectionDescription}>
            Suladigin bitkileri isaretlemeyi unutma!
          </ThemedText>
          <FlatList
            data={plantss}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.plantList}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={styles.plantRow}>
                <PlantCard
                  name={item.name}
                  description={item.description}
                  image={{ uri: item.imageUrl }}
                  style={[styles.plantCard, { backgroundColor: theme.fourthBg }]}
                  onPress={() =>
                    router.push({
                      pathname: "/plant/details",
                      params: { id: item.id },
                    })
                  }
                />
                <TouchableOpacity
                  onPress={() => handleWaterPlant(item.id)}
                  style={[
                    styles.waterButton,
                    { backgroundColor: theme.thirdBg || "#34d399" },
                  ]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="water" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          />
        </ThemedCard>

        <ThemedCard style={styles.discoveryCard}>
          <View style={styles.discoveryHeader}>
            <ThemedTitle style={{ fontSize: 20 }}>Goz At</ThemedTitle>
            <TouchableOpacity
              onPress={() => router.push("/(dashboard)/education")}
            >
              <ThemedText style={styles.linkText}>Tum egitimler</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={{ color: "#888", marginBottom: 14 }}>
            Top egitimler
          </ThemedText>

          {topTrainings.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/(dashboard)/education/module",
                  params: { id: item.id },
                })
              }
              style={[
                styles.trainingRow,
                {
                  backgroundColor: theme.secondBg,
                  borderColor:
                    selectedTheme === "dark"
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.05)",
                  marginBottom: index === topTrainings.length - 1 ? 0 : 10,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedTitle style={{ fontSize: 16 }}>
                  {item.title}
                </ThemedTitle>
                <ThemedText style={{ color: "#888", marginTop: 4 }}>
                  {item.duration} • Egitim Modulu
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.thirdBg}
              />
            </TouchableOpacity>
          ))}
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
    backgroundColor: "red",
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
    color: "#888",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  plantList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  plantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  plantCard: {
    flex: 1,
  },
  waterButton: {
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
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
    color: "#537354",
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
