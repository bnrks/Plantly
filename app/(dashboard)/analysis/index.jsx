import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { useRouter } from "expo-router";
export default function Analysis() {
  const [step, setStep] = useState("instruction"); // 'instruction', 'capturing', 'preview'
  const [photoUri, setPhotoUri] = useState(null);
  const router = useRouter();

  // Kamera izni isteği
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Kamera izni verilmedi. Ayarlardan izin verin."
        );
      }
    })();
  }, []);
  useEffect(() => {
    if (step === "capturing") {
      (async () => {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled) {
          setPhotoUri(result.assets[0].uri);
          setStep("preview");
        } else {
          setStep("instruction");
        }
      })();
    }
  }, [step]);
  const startCapture = () => setStep("capturing");

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        setStep("preview");
      } else {
        setStep("instruction");
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Hata", "Fotoğraf alınamadı. Tekrar deneyin.");
      setStep("instruction");
    }
  };

  const confirmPhoto = () => {
    router.push({
      pathname: "/analysis/results",
      params: { photoUri },
    });
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    takePhoto();
  };

  return (
    <ThemedView style={styles.container}>
      {step === "instruction" && (
        <View style={styles.block}>
          <ThemedTitle style={styles.title}>Yaprak Analizi</ThemedTitle>
          <ThemedText style={styles.text}>
            Fotoğraf çekerken yaprağın tüm kenarlarını görünür şekilde tutun.
            Beyaz düz bir arka plan tercih edin.
          </ThemedText>
          <ThemedButton
            title="Başla"
            onPress={startCapture}
            style={styles.button}
          />
        </View>
      )}

      {step === "capturing" && (
        <View style={styles.block}>
          <ThemedText style={styles.text}>Kamera açılıyor…</ThemedText>
          {/* artık burada TAKE_PHOTO çağrısı YOK */}
        </View>
      )}

      {step === "preview" && photoUri && (
        <View style={styles.block}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <View style={styles.actionRow}>
            <ThemedButton
              title="Onayla"
              onPress={confirmPhoto}
              style={styles.button}
            />
            <ThemedButton
              title="Tekrar Çek"
              onPress={retakePhoto}
              style={styles.button}
            />
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  block: {
    alignItems: "center",
  },
  title: {
    marginBottom: 20,
  },
  text: {
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    width: 180,
    marginVertical: 10,
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
