import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
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
const Home = () => {
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);
  const router = useRouter();
  const notificationCount = plantss.length;
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const username = user?.displayName || "Kullanıcı";
  const userid = user?.uid || "";
  const registeredRef = useRef(false);
  useEffect(() => {
    if (user?.uid && !registeredRef.current) {
      registeredRef.current = true; // aynı oturumda birden fazla çağrılmasın
      registerForPush(user.uid).catch(console.warn);
    }
  }, [user?.uid]);
  // Kullanıcı yoksa login'e at
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  // Bitkileri sadece kullanıcı varsa çek
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
      console.error("Sulama güncelleme hatası:", e);
    }
  };

  return (
    <>
      <ThemedView style={{ flex: 1, padding: 20, paddingTop: 10 }} safe={true}>
        <Header />
        <ThemedCard
          style={{
            height: "20%",
            width: "100%",
            justifyContent: "center",
            paddingHorizontal: 20,
            borderRadius: 20,
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
              <ThemedText>{notificationCount} tane bildirimin var.</ThemedText>
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
        {/* Orta kısım */}
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
          {/* Kullanıcıya açıklama */}
          <ThemedText
            style={{
              fontSize: 15,
              color: "#888",
              paddingLeft: 20,
              marginBottom: 10,
            }}
          >
            Suladığın bitkileri işaretlemeyi unutma!
          </ThemedText>

          <FlatList
            data={plantss}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff", // kart zemin rengi (koyu temadaysan "#18181b" öneririm)
                  borderRadius: 18, // kart yuvarlaklığı

                  marginHorizontal: 2, // yana biraz boşluk
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
                      onPress={() => console.log(item.name, "tıklandı")}
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
      </ThemedView>

      {/* Loading Overlay - En üstte, tüm ekranı kaplar */}
      {loading && <Loading>Bitkiler yükleniyor...</Loading>}
    </>
  );
};

export default Home;

const styles = StyleSheet.create({});
