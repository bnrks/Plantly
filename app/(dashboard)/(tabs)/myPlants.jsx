import { StyleSheet, FlatList } from "react-native";
import { useState, useEffect, useContext } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchPlants } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import ThemedCard from "../../../components/ThemedCard";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import PlantCard from "../../../components/PlantCard";
import ThemedButton from "../../../components/ThemedButton";
import Loading from "../../../components/Loading";
const MyPlants = () => {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const userid = useContext(AuthContext).user.uid;
  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);

  useEffect(() => {
    if (!initialFetched && refresh !== "true") {
      setLoading(true);
      fetchPlants(userid, setPlantss, setLoading);
      setInitialFetched(true);
    }
  }, []);
  useEffect(() => {
    if (refresh === "true") {
      setLoading(true);
      fetchPlants(userid, setPlantss, setLoading);
      router.replace({ pathname: "/myPlants" });
    }
  }, [refresh]);

  if (loading) {
    return <Loading>Yükleniyor</Loading>;
  }
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
                  pathname: "/plant/details", // doğru dosya adı
                  params: {
                    id: item.id,
                  },
                })
              }
            />
          )}
        />
      </ThemedCard>
      <ThemedButton
        title="Yeni Bitki Ekle"
        onPress={() => router.push("../addPlant")}
        style={{ marginTop: 10 }}
        textStyle={{ fontSize: 18 }}
      />
    </ThemedView>
  );
};

export default MyPlants;

const styles = StyleSheet.create({});
