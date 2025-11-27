import { useContext } from "react";
import { View, Image, Alert, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import Asistant from "../../../assets/plantly-asistant.png";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import {
  useAnalysisFlow,
  usePhotoCapture,
  useImageCache,
} from "../../../src/hooks";
import { styles } from "../../../css/analysisStyles";

// Analyzer icon
const analyzerIcon = require("../../../assets/analyzer_icon.png");

export default function Analysis() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  // Custom hooks
  const { step, goToPreview, goToInstruction, resetFlow } = useAnalysisFlow();
  const { photoUri, takePhoto, pickImage, clearPhoto } = usePhotoCapture();
  const { isProcessing, saveImageToCache } = useImageCache();

  /** Görüntüyü analiz için chat'e gönder */
  const sendToAnalysis = async () => {
    if (!photoUri) return;

    const cachedUri = await saveImageToCache(photoUri);
    if (!cachedUri) return;

    router.push({
      pathname: "/(dashboard)/(tabs)/chat",
      params: {
        analysisImage: cachedUri,
        plantId: id, // Bitki ID'si
        analysisMode: "true",
      },
    });
  };

  /** 2) Fotoğraf çekiminden preview'a geç */
  const handlePhotoTaken = async () => {
    await takePhoto();
    // takePhoto hook'u photoUri'yi set eder, sonra preview'a geç
    goToPreview();
  };

  /** 3) Galeriden fotoğraf seçiminden preview'a geç */
  const handleGalleryPick = async () => {
    await pickImage();
    // pickImage hook'u photoUri'yi set eder, sonra preview'a geç
    goToPreview();
  };

  /** 4) UI  */
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Yapay Zeka Hastalık Analizi Başlık Butonu */}
        <View style={[localStyles.analysisBanner, { backgroundColor: theme.thirdBg }]}>
          <Image source={analyzerIcon} style={localStyles.analyzerIcon} />
          <View style={localStyles.bannerTextContainer}>
            <ThemedTitle style={localStyles.bannerTitle}>{t('analysis.aiTitle')}</ThemedTitle>
            <ThemedTitle style={localStyles.bannerSubtitle}>{t('analysis.aiSubtitle')}</ThemedTitle>
          </View>
        </View>

        {step === "instruction" && (
          <View style={styles.block}>
            {/* Büyük Asistant resmi */}
            <View style={styles.assistantContainer}>
              <Image source={Asistant} style={styles.assistantImage} />
            </View>

            <ThemedCard style={styles.infoCard}>
              <ThemedTitle style={styles.title}>
                {t('analysis.leafAnalysis')}
              </ThemedTitle>
              <ThemedText style={styles.subtitle}>
                {t('analysis.leafAnalysisDescription')}
              </ThemedText>

              <View style={styles.divider} />

              <ThemedText style={styles.text}>
                {t('analysis.analysisInstructions')}
              </ThemedText>

              <View style={styles.tipsContainer}>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    {t('analysis.tip1')}
                  </ThemedText>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    {t('analysis.tip2')}
                  </ThemedText>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    {t('analysis.tip3')}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <ThemedButton
                  title={t('analysis.takePhoto')}
                  onPress={handlePhotoTaken}
                  style={styles.button}
                  icon={
                    <Ionicons
                      name="camera"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  }
                />
                <ThemedButton
                  title={t('analysis.selectFromGallery')}
                  onPress={handleGalleryPick}
                  style={styles.button}
                  icon={
                    <Ionicons
                      name="images"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  }
                />
              </View>
            </ThemedCard>
          </View>
        )}

        {step === "preview" && photoUri && (
          <View style={styles.block}>
            <ThemedCard style={styles.previewCard}>
              <ThemedTitle style={styles.previewTitle}>
                {t('analysis.confirmPhoto')}
              </ThemedTitle>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              <ThemedText style={styles.previewText}>
                {t('analysis.confirmPhotoDescription')}
              </ThemedText>
              <View style={styles.actionRow}>
                <ThemedButton
                  title={isProcessing ? t('analysis.analyzing') : t('analysis.confirmAndAnalyze')}
                  onPress={sendToAnalysis}
                  disabled={isProcessing}
                  icon={
                    <Ionicons
                      name="analytics"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  }
                />
                <ThemedButton
                  title={t('analysis.retake')}
                  onPress={() => {
                    clearPhoto();
                    goToInstruction();
                  }}
                  style={{ backgroundColor: theme.secondBg }}
                  textStyle={{ color: theme.text }}
                  icon={
                    <Ionicons
                      name="refresh"
                      size={20}
                      color={theme.text}
                      style={{ marginRight: 8 }}
                    />
                  }
                />
              </View>
            </ThemedCard>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const localStyles = StyleSheet.create({
  analysisBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  analyzerIcon: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 0,
  },
  bannerSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
});
