// app/analysis/results.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedCard from "../../../components/ThemedCard";
import ThemedButton from "../../../components/ThemedButton";
import Loading from "../../../components/Loading";
import { classifyImage } from "../../../src/services/inferenceService";
import { pingServer } from "../../../src/services/inferenceService";
export default function AnalysisResults() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams(); // /analysis/results?photoUri=...
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [answer, setAnswer] = useState(null);
  async function groqChat(prompt) {
    setLoading(true);
    try {
      const res = await fetch(
        "https://2d4c-212-253-193-24.ngrok-free.app/groq-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );
      const json = await res.json();
      console.log("json.answer", json.answer); // Doğrudan API cevabını gösterir
      setAnswer(json.answer);
    } catch (e) {
      console.error(e);
      setAnswer("Sunucuya bağlanırken hata oluştu.");
    }
    setLoading(false);
  }
  useEffect(() => {
    (async () => {
      try {
        const ping = await pingServer();
        const out = await classifyImage(photoUri); // 📡 gerçek istek
        setResults({
          disease: out.class,
          confidence: Math.max(...out.probs),
          advice: await adviseFromClass(out.class),
        });
        setLoading(false); // ✅ sadece başarıda
      } catch (e) {
        alert("Analiz hatası: " + e.message);
        console.log("FETCH HATASI:", e);
        router.back(); // kullanıcıyı geri at
      }
    })();
  }, [photoUri]);
  async function adviseFromClass(cls) {
    switch (cls) {
      case "rust":
        const rustRes = await groqChat(
          "Kullanıcının bitkisi " +
            "%95" +
            " güvenle " +
            cls +
            " hastalığına sahip. Bitkisinin türü ise orkide. Kullanıcıya önerilerde bulun."
        );
        return rustRes;
      case "powdery":
        const powderyRes = await groqChat(
          "Kullanıcının bitkisi " +
            "%95" +
            " güvenle " +
            cls +
            " hastalığına sahip. Bitkisinin türü ise orkide. Kullanıcıya önerilerde bulun."
        );
        return powderyRes;
      default:
        const res = await groqChat(
          "Kullanıcının bitkisi " +
            "%95" +
            " güvenle " +
            cls +
            " hastalığına sahip. Bitkisinin türü ise orkide. Kullanıcıya önerilerde bulun."
        );
        return res;
    }
  }
  if (loading) {
    return <Loading>Yükleniyor</Loading>;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedCard style={styles.imageCard}>
          <Image source={{ uri: photoUri }} style={styles.image} />
        </ThemedCard>
        <ThemedTitle style={styles.title}>Analiz Sonuçları</ThemedTitle>

        {/* Hastalık ve Güven */}
        <ThemedCard style={styles.card}>
          <ThemedText style={styles.label}>Hastalık:</ThemedText>
          <ThemedText style={styles.value}>{results.disease}</ThemedText>
          <ThemedText style={styles.label}>Güven:</ThemedText>
          <ThemedText style={styles.value}>
            {(results.confidence * 100).toFixed(0)}%
          </ThemedText>
        </ThemedCard>

        {/* Öneriler */}
        <ThemedCard style={styles.card}>
          <ThemedText style={styles.label}>Öneriler:</ThemedText>
          <ThemedText style={styles.value}>{results.advice}</ThemedText>
        </ThemedCard>

        <View style={styles.buttons}>
          <ThemedButton
            title="Yeni Analiz"
            onPress={() => router.replace("/analysis")}
          />
          <ThemedButton title="Ana Sayfa" onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  imageCard: { borderRadius: 12, overflow: "hidden", marginBottom: 20 },
  image: { width: "100%", height: 250 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  card: { padding: 16, borderRadius: 12, marginVertical: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  value: { fontSize: 16, marginTop: 4 },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
