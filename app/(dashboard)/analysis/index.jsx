import { useContext } from "react";
import { View, Image, Alert, ScrollView } from "react-native";
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

export default function Analysis() {
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
        {step === "instruction" && (
          <View style={styles.block}>
            {/* Büyük Asistant resmi */}
            <View style={styles.assistantContainer}>
              <Image source={Asistant} style={styles.assistantImage} />
            </View>

            <ThemedCard style={styles.infoCard}>
              <ThemedTitle style={styles.title}>
                Planty ile Yaprak Analizi
              </ThemedTitle>
              <ThemedText style={styles.subtitle}>
                Yapay zeka asistanımız Planty ile bitkinizin sağlığını kontrol
                edin!
              </ThemedText>

              <View style={styles.divider} />

              <ThemedText style={styles.text}>
                Bitkinizdeki olası hastalıkları tespit etmek için net bir yaprak
                görüntüsü çekin. Analiz sonucu bitkinin durumu ve bakım
                önerileri hakkında detaylı bilgi alacaksınız.
              </ThemedText>

              <View style={styles.tipsContainer}>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    Yaprağı tam çerçeveye alın
                  </ThemedText>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    İyi aydınlatılmış ortamda çekim yapın
                  </ThemedText>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <ThemedText style={styles.tipText}>
                    Arka planın sade olmasına özen gösterin
                  </ThemedText>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <ThemedButton
                  title="Fotoğraf Çek"
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
                  title="Galeriden Seç"
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
                Fotoğrafı Onaylayın
              </ThemedTitle>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              <ThemedText style={styles.previewText}>
                Bu görüntü analiz için uygun mu? Eğer yaprak net görünmüyorsa,
                yeniden çekim yapabilirsiniz.
              </ThemedText>
              <View style={styles.actionRow}>
                <ThemedButton
                  title={isProcessing ? "İşleniyor..." : "Onayla ve Analiz Et"}
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
                  title="Tekrar Çek"
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
