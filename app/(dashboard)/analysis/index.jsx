import React, { useState } from "react";
import { StyleSheet, View, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { useRouter } from "expo-router";

export default function Analysis() {
  const [step, setStep] = useState("instruction"); // instruction | preview
  const [photoUri, setPhotoUri] = useState(null);
  const router = useRouter();

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

  /** 2) Onayla -> Results sayfasına kalıcı URI ile git */
  const confirmPhoto = () => {
    router.push({
      pathname: "/analysis/results",
      params: { photoUri },
    });
  };

  /** 3) UI  */
  return (
    <ThemedView style={styles.container}>
      {step === "instruction" && (
        <View style={styles.block}>
          <ThemedTitle style={styles.title}>Yaprak Analizi</ThemedTitle>
          <ThemedText style={styles.text}>
            Fotoğraf çekerken yaprağı net ve arka planı sade tutun.
          </ThemedText>
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Fotoğraf Çek"
              onPress={takePhoto}
              style={styles.button}
            />
            <ThemedButton
              title="Galeriden Seç"
              onPress={pickFromGallery}
              style={styles.button}
            />
          </View>
        </View>
      )}

      {step === "preview" && photoUri && (
        <View style={styles.block}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <View style={styles.actionRow}>
            <ThemedButton title="Onayla" onPress={confirmPhoto} />
            <ThemedButton
              title="Tekrar Seç"
              onPress={() => setStep("instruction")}
            />
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  block: { alignItems: "center" },
  title: { marginBottom: 20 },
  text: { marginBottom: 30, textAlign: "center" },
  preview: { width: "100%", height: 300, borderRadius: 12, marginBottom: 20 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 10, // Butonlar arası boşluk
    width: "100%",
  },
  button: {
    width: "100%",
  },
});
