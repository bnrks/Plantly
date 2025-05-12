import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React from "react";
import ThemedCard from "../../../components/ThemedCard";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import PlantCard from "../../../components/PlantCard";
import LoginScreen from "../../(auth)/login";
import { Link } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
const Home = () => {
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
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  return (
    <ThemedView
      style={{
        flex: 1,
        padding: 20,
      }}
    >
      {/* ÜST KISIM */}
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
          {/* SOL TARAF */}
          <View style={{ width: "80%" }}>
            <ThemedTitle style={{ fontSize: 20 }}>Merhaba, Burak</ThemedTitle>
            <ThemedText>3 tane bildirimin var.</ThemedText>
          </View>

          {/* SAĞ TARAF */}
          <TouchableOpacity onPress={() => alert("Bildirimler")}>
            <View style={{ position: "relative" }}>
              <Ionicons name="notifications-outline" size={28} color="black" />
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
                  3
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ThemedCard>
      {/* orta kısım */}
      <ThemedCard
        style={{
          height: "70%",
          width: "100%",
          marginTop: 20,
          borderRadius: 20,
        }}
      >
        <ThemedTitle style={{ fontSize: 20, padding: 20 }}>
          Bitkilerim
        </ThemedTitle>

        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlantCard
              name={item.name}
              description={item.description}
              image={item.image}
              onPress={() => console.log(item.name, "tıklandı")}
            />
          )}
        />
      </ThemedCard>

      <Link href={"login"}>login</Link>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({});
