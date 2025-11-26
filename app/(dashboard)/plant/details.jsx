import { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import ScreenContainer from "../../../components/ScreenContainer";
import BackButton from "../../../components/BackButton";
import { useContext } from "react";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { fetchPlantById } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import PlantDetailsSkeleton from "../../../components/skeletons/PlantDetailsSkeleton";
import { deletePlant } from "../../../src/services/firestoreService";
import Header from "../../../components/Header";

// Yapay Zeka butonu için ikon
const analyzerIcon = require("../../../assets/analyzer_icon.png");
export default function PlantDetails() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const { id } = useLocalSearchParams();
  const [plant, setPlant] = useState({});
  const [loading, setLoading] = useState(true);

  // User yoksa erken return
  if (!user) {
    return null;
  }

  const userid = user.uid;
  useEffect(() => {
    async function getPlant() {
      const info = await fetchPlantById(userid, id);
      if (info) setPlant(info);
      setLoading(false);
    }
    getPlant();
  }, []);
  function handleDelete() {
    deletePlant(userid, id)
      .then(() => {
        router.push({
          pathname: "/(dashboard)/(tabs)/plants",
          params: { refresh: "true" },
        });
      })
      .catch((error) => {
        console.error("Error deleting plant:", error);
      });
  }
  const confirmDelete = () => {
    Alert.alert(
      "Silme Onayı",
      "Bu bitki kaydını silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: handleDelete },
      ]
    );
  };
  function diseaseToStatus(disease) {
    switch (disease) {
      case "late_blight":
        return "Hasta";
      case "bacterial_spot":
        return "Hasta";
      case "early_blight":
        return "Hasta";
      default:
        return "Sağlıklı";
    }
  }

  function diseaseToDescription(disease) {
    switch (disease) {
      case "late_blight":
        return "Geç yanıklık hastalığına sahip.";
      case "bacterial_spot":
        return "Bakteriyel leke hastalığına sahip.";
      case "early_blight":
        return "Erken yanıklık hastalığına sahip.";
      default:
        return "Herhangi bir hastalık belirtisi yok.";
    }
  }
  // TODO: Backend ile entegre edilecek => örnek veri
  const plantexample = {
    name: plant.name,
    description: plant.description,
    species: plant.species,
    image: { uri: plant.imageUrl },
    status: diseaseToStatus(plant.disease),
    statusDescription: diseaseToDescription(plant.disease),
    suggestions: plant.suggestions || ["Bakım önerisi yok"],
    notes: plant.notes || ["Not yok."],
    waterLevel: plant.waterLevel || 60,
    lightLevel: plant.lightLevel || 40,
    measureLevel: plant.measureLevel || 30,
  };
  if (loading) {
    return <PlantDetailsSkeleton />;
  }
  // Arkaplan rengi: dark modda thirdBg, light modda fourthBg
  const backgroundColor = selectedTheme === "dark" ? theme.fifthBg : theme.fifthBg;

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.scrollContent}
      bottomSpacing={40}
      style={{ backgroundColor }}
    >
      {/* Header Row: BackButton ve Header aynı hizada */}
      <View style={styles.headerRow}>
        <BackButton style={styles.backButton} />
        <View style={styles.headerWrapper}>
          <Header />
        </View>
      </View>

      {/* Bitki Resmi */}
      <Image source={plantexample.image} style={styles.image} />

      {/* Bitki Adı ve Durum */}
      <View style={styles.titleSection}>
        <ThemedTitle style={styles.title}>{plantexample.name}</ThemedTitle>
        <View style={styles.speciesRow}>
          <ThemedText style={styles.speciesText}>
            {plantexample.species}
          </ThemedText>
          <ThemedText style={styles.separator}> | </ThemedText>
          <ThemedText
            style={[
              styles.statusText,
              {
                color:
                  plantexample.status === "Sağlıklı"
                    ? "#4CAF50"
                    : theme.danger,
              },
            ]}
          >
            {plantexample.status}
          </ThemedText>
        </View>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.analysisButton, { backgroundColor: theme.thirdBg }]}
          onPress={() =>
            router.push({
              pathname: "analysis",
              params: { id: id },
            })
          }
          activeOpacity={0.8}
        >
          <Image source={analyzerIcon} style={styles.analyzerIconImage} />
          <View style={styles.analysisTextContainer}>
            <ThemedText style={styles.analysisButtonText}>Yapay Zeka Hastalık</ThemedText>
            <ThemedText style={styles.analysisButtonText}>Analizi</ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              backgroundColor:
                selectedTheme === "dark" ? theme.fifthBg : theme.fourthBg,
            },
          ]}
          onPress={() => {
            router.push({
              pathname: "/plant/editplant",
              params: { id: id },
            });
          }}
        >
          <Ionicons name="pencil" size={18} color={theme.text} />
          <ThemedText style={styles.editButtonText} numberOfLines={1}>Düzenle</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: "#FFEBEE" }]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Bakım Önerileri */}
      <ThemedCard
        style={[styles.careCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionHeader}>Bakım Önerileri</ThemedTitle>
        {plantexample.suggestions.map((suggestion, idx) => (
          <View key={idx} style={styles.suggestionRow}>
            <MaterialCommunityIcons
              name={
                suggestion.includes("Su")
                  ? "water"
                  : suggestion.includes("Işık") || suggestion.includes("Aydın")
                  ? "white-balance-sunny"
                  : "thermometer"
              }
              size={18}
              color={theme.text}
            />
            <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
          </View>
        ))}
      </ThemedCard>

      {/* Notlar */}
      {plantexample.notes && plantexample.notes.length > 0 && plantexample.notes[0] !== "Not yok." && (
        <ThemedCard
          style={[styles.careCard, { backgroundColor: theme.secondBg }]}
        >
          <ThemedTitle style={styles.sectionHeader}>Notlar</ThemedTitle>
          {plantexample.notes.map((note, idx) => (
            <ThemedText key={idx} style={styles.noteText}>
              • {note}
            </ThemedText>
          ))}
        </ThemedCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 1,
  },
  headerWrapper: {
    flex: 1,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  titleSection: {
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  speciesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  speciesText: {
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "500",
    opacity: 0.8,
  },
  separator: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  analysisButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 64,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  analyzerIconImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  analysisTextContainer: {
    flex: 1,
  },
  analysisButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  editButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    width: 48,
    borderRadius: 12,
  },
  careCard: {
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
});
