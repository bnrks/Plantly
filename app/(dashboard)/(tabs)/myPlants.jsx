import { StyleSheet, Text, View, FlatList } from "react-native";
import { useState, useEffect } from "react";
import ThemedCard from "../../../components/ThemedCard";
import ThemedView from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import PlantCard from "../../../components/PlantCard";
import ThemedButton from "../../../components/ThemedButton";
import { useRouter } from "expo-router";
import { fetchPlants } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import { useContext } from "react";
const MyPlants = () => {
  const router = useRouter();
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const userid = useContext(AuthContext).user.uid;
  console.log(userid);
  useEffect(() => {
    const list = fetchPlants(userid, setPlantss, setLoading);
    setPlantss(list);
    console.log("plantlar", plantss);
  }, []);

  const plants = [
    {
      id: "1",
      name: "Aloe Vera",
      description: "Güneşi sever, haftada 1 kez su ister.",
      image: require("../../../assets/plantly-logo.png"),
    },
    {
      id: "2",
      name: "Aloe Vera",
      description: "Güneşi sever, haftada 1 kez su ister.",
      image: require("../../../assets/plantly-logo.png"),
    },
    {
      id: "3",
      name: "Aloe Vera",
      description: "Güneşi sever, haftada 1 kez su ister.",
      image: require("../../../assets/plantly-logo.png"),
    },
    {
      id: "4",
      name: "Aloe Vera",
      description: "Güneşi sever, haftada 1 kez su ister.",
      image: require("../../../assets/plantly-logo.png"),
    },
    {
      id: "5",
      name: "Aloe Vera",
      description: "Güneşi sever, haftada 1 kez su ister.",
      image: require("../../../assets/plantly-logo.png"),
    },
  ];
  return (
    <ThemedView style={{ flex: 1, padding: 10, height: "100%" }}>
      <ThemedCard
        style={{
          height: "75%",
          width: "100%",
          marginTop: 10,
          borderRadius: 20,
        }}
      >
        <ThemedTitle style={{ fontSize: 20, padding: 20 }}>
          Bitkilerim
        </ThemedTitle>

        <FlatList
          data={plantss}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlantCard
              name={item.name}
              description={item.description}
              image={{ uri: item.imageUrl }}
              onPress={() =>
                router.push({
                  pathname: "../plantDetails", // doğru dosya adı
                  params: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    imageUrl: item.imageUrl,
                  },
                })
              }
            />
          )}
        />
      </ThemedCard>
      <ThemedButton
        title="Yeni Bitki Ekle"
        onPress={() => console.log("Tıklandı")}
        style={{ marginTop: 10 }}
        textStyle={{ fontSize: 18 }}
      />
    </ThemedView>
  );
};

export default MyPlants;

const styles = StyleSheet.create({});
