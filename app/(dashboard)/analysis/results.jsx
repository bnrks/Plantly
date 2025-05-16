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
export default function AnalysisResults() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams(); // /analysis/results?photoUri=...
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Gerçek servis burada çağrılacak
    setTimeout(() => {
      setResults({
        disease: "Pas",
        confidence: 0.92,
        advice: "Toprağı kuru tut, mantar ilacı uygula.",
      });
      setLoading(false);
    }, 1000);
  }, []);

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
