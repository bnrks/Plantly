import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import ThemedCard from "../../../components/ThemedCard";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import PlantCard from "../../../components/PlantCard";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import Header from "../../../components/Header";
import { fetchPlantsForWatering } from "../../../src/services/firestoreService";
import { updatePlantWatering } from "../../../src/services/firestoreService";
const Home = () => {
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);

  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const username = useContext(AuthContext).user.displayName || "Kullanıcı";
  const userid = useContext(AuthContext)?.user?.uid;

  // Bildirim sayısı = sulanmamış bitki sayısı = plantss.length
  const notificationCount = plantss.length;

  useEffect(() => {
    if (!initialFetched && userid) {
      setLoading(true);
      fetchPlantsForWatering(userid, setPlantss, setLoading);
      setInitialFetched(true);
    }
  }, [userid]);

  // Bitkiyi sulama - state'den silme
  const handleWaterPlant = async (plantId) => {
    // Önce local state'den çıkar
    setPlantss((prev) => prev.filter((plant) => plant.id !== plantId));
    // Sonra veritabanında lastWatered alanını güncelle
    try {
      await updatePlantWatering(userid, plantId);
    } catch (e) {
      console.error("Sulama güncelleme hatası:", e);
    }
  };

  return (
    <ThemedView style={{ flex: 1, padding: 20 }} safe={true}>
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
              <Ionicons name="notifications-outline" size={28} color="black" />
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
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
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
          Suladığın bitkileri işaretlemeyi unutma
        </ThemedText>

        <FlatList
          data={plantss}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              {/* Bitki Kartı */}
              <View style={{ flex: 1 }}>
                <PlantCard
                  name={item.name}
                  description={item.description}
                  image={{ uri: item.imageUrl }}
                  onPress={() => console.log(item.name, "tıklandı")}
                />
              </View>
              {/* Tik Butonu */}
              <TouchableOpacity
                onPress={() => handleWaterPlant(item.id)}
                style={{
                  backgroundColor: theme.thirdBg,
                  padding: 10,
                  borderRadius: 10,
                  marginLeft: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        />
      </ThemedCard>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({});
