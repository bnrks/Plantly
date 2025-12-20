import { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "../../../constants/Colors";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import ScreenContainer from "../../../components/ScreenContainer";
import BackButton from "../../../components/BackButton";
import CustomAlert from "../../../components/CustomAlert";
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
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const { id } = useLocalSearchParams();
  const [plant, setPlant] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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
    setShowDeleteAlert(false);
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
    setShowDeleteAlert(true);
  };
  const lastDiseaseClassTr = plant?.lastDisease?.classTr;
  const hasLastDisease = Boolean(lastDiseaseClassTr);

  const diseaseHistoryEntries = (() => {
    const raw = plant?.diseaseHistory;
    if (!raw) return [];

    const asArray = Array.isArray(raw)
      ? raw.map((item, index) => ({ id: String(index), ...(item || {}) }))
      : Object.entries(raw).map(([key, value]) => ({
          id: String(key),
          ...(value || {}),
        }));

    const resolveDate = (entry) => {
      const at = entry?.at;
      if (at?.toDate) return at.toDate();
      if (at instanceof Date) return at;
      if (typeof at === "number") return new Date(at);
      if (typeof at === "string" || at instanceof String) {
        const parsed = new Date(at);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
      const fromKey = Number(entry?.id);
      if (Number.isFinite(fromKey)) return new Date(fromKey);
      return null;
    };

    return asArray
      .map((entry) => ({ ...entry, _atDate: resolveDate(entry) }))
      .sort((a, b) => {
        const atA = a?._atDate?.getTime?.() ?? 0;
        const atB = b?._atDate?.getTime?.() ?? 0;
        return atB - atA;
      });
  })();

  const formatHistoryDate = (date) => {
    if (!date) return "";
    try {
      return date.toLocaleString();
    } catch {
      return String(date);
    }
  };
  // TODO: Backend ile entegre edilecek => örnek veri
  const plantexample = {
    name: plant.name,
    description: plant.description,
    species: plant.species,
    image: { uri: plant.imageUrl },
    // Hastalık bilgisini Firestore'daki lastDisease(map) field'ından al
    status: hasLastDisease ? lastDiseaseClassTr : t('plants.healthy'),
    statusDescription: hasLastDisease ? "" : t('plants.noSickDescription'),
    suggestions: plant.suggestions || [t('plants.noCareRecommendations')],
    notes: plant.notes || [t('plants.noNotes')],
    waterLevel: plant.waterLevel || 60,
    lightLevel: plant.lightLevel || 40,
    measureLevel: plant.measureLevel || 30,
  };
  if (loading) {
    return <PlantDetailsSkeleton />;
  }

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.scrollContent}
      bottomSpacing={40}
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
                  hasLastDisease ? theme.danger : theme.success,
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
          style={[styles.analysisButton, { backgroundColor: Colors.primary }]}
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
            <ThemedText style={styles.analysisButtonText}>{t('plants.aiAnalysisTitle')}</ThemedText>
            <ThemedText style={styles.analysisButtonText}>{t('plants.aiAnalysisSubtitle')}</ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              backgroundColor: theme.fifthBg,
            },
          ]}
          onPress={() => {
            router.push({
              pathname: "/plant/editplant",
              params: { id: id },
            });
          }}
        >
          <Ionicons name="pencil" size={18} color={theme.title} />
          <ThemedText style={styles.editButtonText} numberOfLines={1}>{t('plants.edit')}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: "#FFEBEE" }]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Bakım Önerileri */}
      <ThemedCard
        style={[styles.careCard, { backgroundColor: theme.secondBg }]}
      >
        <ThemedTitle style={styles.sectionHeader}>{t('plants.careRecommendations')}</ThemedTitle>
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

      {/* Hastalık Geçmişi */}
      <ThemedCard style={[styles.careCard, { backgroundColor: theme.secondBg }]}>
        <ThemedTitle style={styles.sectionHeader}>{t('plants.diseaseHistory')}</ThemedTitle>

        {diseaseHistoryEntries.length === 0 ? (
          <ThemedText style={styles.historyEmptyText}>{t('plants.noDiseaseHistory')}</ThemedText>
        ) : (
          diseaseHistoryEntries.map((entry) => {
            const title = entry?.classTr || entry?.class || "";
            const stage = entry?.stageTr || entry?.stage || entry?.recoveryStageTr || entry?.recoveryStage;
            const confidence = typeof entry?.confidence === "number" ? Math.round(entry.confidence * 100) : null;
            const dateText = formatHistoryDate(entry?._atDate);

            return (
              <View key={entry.id} style={styles.historyRow}>
                <ThemedText style={styles.historyTitleText}>{title}</ThemedText>
                {dateText ? <ThemedText style={styles.historyMetaText}>{dateText}</ThemedText> : null}
                {stage ? <ThemedText style={styles.historyMetaText}>{String(stage)}</ThemedText> : null}
                {confidence !== null ? (
                  <ThemedText style={styles.historyMetaText}>{`${confidence}%`}</ThemedText>
                ) : null}
              </View>
            );
          })
        )}
      </ThemedCard>

      {/* Notlar */}
      {plantexample.notes && plantexample.notes.length > 0 && plantexample.notes[0] !== t('plants.noNotes') && (
        <ThemedCard
          style={[styles.careCard, { backgroundColor: theme.secondBg }]}
        >
          <ThemedTitle style={styles.sectionHeader}>{t('plants.notes')}</ThemedTitle>
          {plantexample.notes.map((note, idx) => (
            <ThemedText key={idx} style={styles.noteText}>
              • {note}
            </ThemedText>
          ))}
        </ThemedCard>
      )}

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        type="warning"
        title={t('plants.deleteConfirmTitle')}
        message={t('plants.deleteConfirmMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        showCancel={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteAlert(false)}
      />
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
  historyRow: {
    marginBottom: 12,
  },
  historyTitleText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  historyMetaText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  historyEmptyText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
});
