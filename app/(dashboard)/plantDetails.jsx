import { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import ThemedView from "../../components/ThemedView";
import ThemedTitle from "../../components/ThemedTitle";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { useContext } from "react";
import { ThemeContext } from "../../src/context/ThemeContext";
import { fetchPlantById } from "../../src/services/firestoreService";
import { AuthContext } from "../../src/context/AuthContext";
import Loading from "../../components/Loading";
export default function PlantDetails() {
  const userid = useContext(AuthContext).user.uid;
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const { id, imageUrl } = useLocalSearchParams();
  const [plant, setPlant] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getPlant() {
      const info = await fetchPlantById(userid, id);
      if (info) setPlant(info);
      setLoading(false);
    }
    getPlant();
  }, []);
  // TODO: Backend ile entegre edilecek => örnek veri
  const plantexample = {
    name: plant.name,
    description: plant.description,
    image: { uri: plant.imageUrl },

    status: "Sağlıklı",
    notes: [
      "Yaprakları haftada bir nemlendirin.",
      "Toprağı her 2 haftada bir gübreleyin.",
      "Güneşi seven bitki, direkt güneş ışığından kaçının.",
    ],
  };
  if (loading) {
    return <Loading>Yükleniyor</Loading>;
  }
  return (
    <ThemedView style={styles.container}>
      {/* Sabit Header */}
      <View
        style={[
          styles.headerContainer,
          {
            position: "absolute",
            top: 10,
            left: -10,
            right: 0,
            zIndex: 1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={
            (styles.backButton,
            { backgroundColor: theme.secondBg, borderRadius: 50, padding: 10 })
          }
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ThemedCard
        style={{
          height: "90%",
          margin: 10,
          borderRadius: 20,
          marginTop: 30,
          paddingTop: 20,
        }}
      >
        {/* İçerik kaydırılabilir */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image source={plantexample.image} style={styles.image} />
          <ThemedTitle style={styles.title}>{plantexample.name}</ThemedTitle>

          <ThemedText style={styles.description}>
            {plantexample.description}
          </ThemedText>
          <ThemedTitle style={{ fontSize: 20 }}>Durum</ThemedTitle>
          <ThemedText style={styles.itemText}>{plantexample.status}</ThemedText>

          <ThemedTitle style={styles.sectionHeader}>
            Bakım Önerileri
          </ThemedTitle>
          {plantexample.notes.map((note, idx) => (
            <ThemedText key={idx} style={styles.itemText}>
              • {note}
            </ThemedText>
          ))}

          <ThemedButton
            title="Analiz Et"
            style={styles.button}
            onPress={() => router.push("analysis")}
          />
        </ScrollView>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 6,
  },
  button: {
    marginTop: 30,
  },
});
