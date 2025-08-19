import { useState, useContext } from "react";
import { StyleSheet, View, Image, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
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

export default function Analysis() {
  const [step, setStep] = useState("instruction"); // instruction | preview
  const [photoUri, setPhotoUri] = useState(null);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  /** 1) Kamera aç ve fotoğrafı kalıcı cache/uploads klasörüne kopyala */
  const takePhoto = async () => {
    try {
      // Kamera aç
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.4, // ≈300-500 KB
      });
      if (res.canceled) return;

      await saveImageToCache(res.assets[0].uri);
    } catch (e) {
      console.warn(e);
      Alert.alert("Hata", "Fotoğraf alınamadı. Tekrar deneyin.");
    }
  };

  /** Galeriden fotoğraf seçme */
  const pickFromGallery = async () => {
    try {
      // Galeri izni kontrol et
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeriye erişim izni vermelisiniz.");
        return;
      }

      // Galeriyi aç - doğru seçeneği kullan
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // MediaType yerine MediaTypeOptions
        allowsEditing: true,
        quality: 0.4,
      });

      if (result.canceled) return;

      await saveImageToCache(result.assets[0].uri);
    } catch (e) {
      console.warn(e);
      Alert.alert("Hata", "Fotoğraf seçilemedi. Tekrar deneyin.");
    }
  };

  /** Görüntüyü önbelleğe kaydetme helper fonksiyonu */
  const saveImageToCache = async (sourceUri) => {
    // Kalıcı klasör (/cache/uploads/) -> mutlaka var olsun
    const cacheDir = FileSystem.cacheDirectory + "uploads/";
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

    // Her seferinde aynı ada yaz: uploads/latest.jpg
    const destUri = cacheDir + "latest.jpg";
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });
    console.log("Fotoğraf kopyalandı:", destUri);

    setPhotoUri(destUri);
    setStep("preview");
  };

  /** 2) Onayla -> Chat sayfasına kalıcı URI ile git */
  const confirmPhoto = () => {
    router.push({
      pathname: "/(dashboard)/(tabs)/chat",
      params: {
        analysisImage: photoUri,
        plantId: id, // Bitki ID'si
        analysisMode: "true",
      },
    });
  };

  /** 3) UI  */
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
                  onPress={takePhoto}
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
                  onPress={pickFromGallery}
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
                  title="Onayla ve Analiz Et"
                  onPress={confirmPhoto}
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
                  onPress={() => setStep("instruction")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  block: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  assistantContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  assistantImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  text: {
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  tipsContainer: {
    marginBottom: 24,
    width: "100%",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 10,
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "100%",
  },
  previewTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewText: {
    textAlign: "center",
    marginBottom: 20,
  },
  actionRow: {
    gap: 12,
    width: "100%",
  },
});
