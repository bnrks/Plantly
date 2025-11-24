import { StyleSheet, FlatList, View } from "react-native";
import { useState, useEffect, useContext } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { fetchPlants } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";

import Header from "../../../components/Header";
import ThemedCard from "../../../components/ThemedCard";
import ThemedTitle from "../../../components/ThemedTitle";
import PlantCard from "../../../components/PlantCard";
import ThemedButton from "../../../components/ThemedButton";
import ScreenContainer from "../../../components/ScreenContainer";
import PlantsSkeleton from "../../../components/skeletons/PlantsSkeleton";

const Plants = () => {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const [plantss, setPlantss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);

  if (!user) return null;
  const userid = user.uid;

  useEffect(() => {
    if (!initialFetched && refresh !== "true") {
      setLoading(true);
      fetchPlants(userid, setPlantss, setLoading);
      setInitialFetched(true);
    }
  }, [initialFetched, refresh, userid]);

  useEffect(() => {
    if (refresh === "true") {
      setLoading(true);
      fetchPlants(userid, setPlantss, setLoading);
      router.replace({ pathname: "/(dashboard)/(tabs)/plants" });
    }
  }, [refresh, router, userid]);

  if (loading) {
    return <PlantsSkeleton />;
  }

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      bottomSpacing={120}
      paddingHorizontal={0}
    >
      <Header />

      <ThemedCard style={[styles.card, { backgroundColor: theme.secondBg }]}>
        <ThemedTitle style={styles.cardTitle}>Bitkilerim</ThemedTitle>

        <FlatList
          data={plantss}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <PlantCard
              name={item.name}
              description={item.description}
              image={{ uri: item.imageUrl }}
              style={[
                styles.plantCard,
                { backgroundColor: theme.fourthBg },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/plant/details",
                  params: { id: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <ThemedTitle style={{ textAlign: "center", marginTop: 20 }}>
              Hic bitkin yok
            </ThemedTitle>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </ThemedCard>

      <ThemedButton
        title="Yeni Bitki Ekle"
        onPress={() => router.push("../addPlant")}
        style={[
          styles.addButton,
          { backgroundColor: theme.thirdBg || "#537354" },
        ]}
        textStyle={{ fontSize: 18 }}
      />
    </ScreenContainer>
  );
};

export default Plants;

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    borderRadius: 26,
    paddingHorizontal: 0,
    paddingVertical: 18,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  plantCard: {
    marginVertical: 0,
    borderRadius: 20,
    padding: 12,
  },
  addButton: {
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 32,
    paddingVertical: 14,
    position: "absolute",
    bottom:-55,
    alignSelf: "center",
    width: "90%",
    
  },
});
