import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useContext, useRef } from "react";
import ThemedCard from "../../../components/ThemedCard";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Loading from "../../../components/Loading";
import { Ionicons } from "@expo/vector-icons";
import PlantCard from "../../../components/PlantCard";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import Header from "../../../components/Header";
import { fetchPlantsForWatering } from "../../../src/services/firestoreService";
import { updatePlantWatering } from "../../../src/services/firestoreService";
import { useRouter } from "expo-router";
import { registerForPush } from "../../../src/notifications/registerForPush";
import { getAuth } from "firebase/auth";
const Home = () => {
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);
  const router = useRouter();
  const notificationCount = plantss.length;
  const topTrainings = [
    {
      id: "starter",
      title: "Baslangic Rehberi",
      duration: "15 dk",
    },
    {
      id: "watering",
      title: "Sulama Akademisi",
      duration: "10 dk",
    },
    {
      id: "diagnosis",
      title: "Hastalik Dedektifi",
      duration: "18 dk",
    },
  ];
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const username = user?.displayName || "Kullanici";
  const userid = user?.uid || "";
  const registeredRef = useRef(false);
  useEffect(() => {
    if (user?.uid && !registeredRef.current) {
      registeredRef.current = true; // ensure we register push notifications once per session
      registerForPush(user.uid).catch(console.warn);
    }
  }, [user?.uid]);
  // If no user is present redirect to login
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  // Helper to log the Firebase id token
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

  // Fetch plants only when user exists
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

  return (
    <>
      <ThemedView style={{ flex: 1 }} safe={true}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 80,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <ThemedCard
            style={{
              height: "14%",
              width: "100%",
              justifyContent: "center",
              paddingHorizontal: 20,
              borderRadius: 20,
              marginTop: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ width: "80%" }}>
                <ThemedTitle style={{ fontSize: 20 }}>
                  Merhaba, {username}
                </ThemedTitle>
                <ThemedText>
                  {notificationCount} tane bildirimin var.
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => alert("Bildirimler")}>
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name="notifications-outline"
                    size={28}
                    color="black"
                  />
                  {notificationCount > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        backgroundColor: "red",
                        borderRadius: 10,
                        width: 18,
                        height: 18,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ThemedCard>
        {/* Orta kisim */}
        <ThemedCard
          style={{
            flex: 1,
            width: "100%",
            minHeight: "50%",
            marginTop: 20,
            borderRadius: 20,
            paddingBottom: 20,
          }}
        >
          <ThemedTitle style={{ fontSize: 20, padding: 20 }}>
            Bitkilerim
          </ThemedTitle>
          {/* Kullaniciya aciklama */}
          <ThemedText
            style={{
              fontSize: 15,
              color: "#888",
              paddingLeft: 20,
              marginBottom: 10,
            }}
          >
            Suladn bitkileri iaretlemeyi unutma!
          </ThemedText>

          <FlatList
            data={plantss}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 18,

                  marginHorizontal: 2,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.fourthBg,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingRight: 10,
                    borderRadius: 12,
                    overflow: "hidden",
                    elevation: 2,
                    marginVertical: 5,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <PlantCard
                      name={item.name}
                      description={item.description}
                      image={{ uri: item.imageUrl }}
                      onPress={() => console.log(item.name, "tiklandi")}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleWaterPlant(item.id)}
                    style={{
                      backgroundColor: theme.thirdBg || "#34d399",
                      padding: 13,
                      borderRadius: 12,
                      marginLeft: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#10b981",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="water" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {/* Tik Butonu */}
              </View>
            )}
          />
        </ThemedCard>

        <ThemedCard
          style={{
            width: "100%",
            marginTop: 20,
            borderRadius: 20,
            paddingVertical: 18,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <ThemedTitle style={{ fontSize: 20 }}>Goz At</ThemedTitle>
            <TouchableOpacity
              onPress={() => router.push("/(dashboard)/education")}
            >
              <ThemedText
                style={{
                  color: theme.thirdBg,
                  fontWeight: "600",
                }}
              >
                Tum egitimler
              </ThemedText>
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: theme.secondBg,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: index === topTrainings.length - 1 ? 0 : 10,
                borderWidth: 1,
                borderColor:
                  selectedTheme === "dark"
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.05)",
              }}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedTitle style={{ fontSize: 16 }}>
                  {item.title}
                </ThemedTitle>
                <ThemedText style={{ color: "#888", marginTop: 4 }}>
                  {item.duration}  Egitim Modulu
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.thirdBg}
              />
            </TouchableOpacity>
          ))}
        </ThemedCard>
        </ScrollView>
      </ThemedView>

      {/* Loading overlay */}
      {loading && <Loading>Bitkiler yukleniyor...</Loading>}
    </>
  );
};

export default Home;

const styles = StyleSheet.create({});











