// app/analysis/results.js
import React, { useEffect, useState, useContext } from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedCard from "../../../components/ThemedCard";
import ThemedButton from "../../../components/ThemedButton";
import Loading from "../../../components/Loading";
import { classifyImage } from "../../../src/services/inferenceService";
import { groqService } from "../../../src/services/groqService";
import {
  fetchPlantById,
  updatePlantSuggestions,
} from "../../../src/services/firestoreService";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Asistant from "../../../assets/plantly-asistant.png";
import Thinking from "../../../assets/plantly-thinking.png";
import { AuthContext } from "../../../src/context/AuthContext";

export default function AnalysisResults() {
  const userid = useContext(AuthContext).user.uid;
  const router = useRouter();
  const { photoUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [plant, setPlant] = useState(null);
  const { id } = useLocalSearchParams();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const [botIcon, setBotIcon] = useState(Asistant);

  async function getPlant() {
    const info = await fetchPlantById(userid, id);
    if (info) {
      console.log("ife girdi", info);
      setPlant(info);
      // Burada güvenle loglama yapabilirsiniz
      console.log("Species:", info.species);
      console.log("Notes:", info.notes);
    }
  }
  useEffect(() => {
    getPlant();
    // console.log satırlarını kaldırın
  }, []);
  async function groqChat(prompt) {
    try {
      setLoading(true);
      const res = await groqService(prompt);
      const parsed = JSON.parse(res);
      const { paragraph, suggestions } = parsed.results;
      return {
        paragraph: paragraph,
        suggestions: suggestions,
      };
    } catch (error) {
      setLoading(false);
      console.error("groqChat error:", error);
      // Hata durumunda da bir şey döndür
      return {
        results: {
          paragraph: "Üzgünüm, bitki analizi yapılırken bir sorun oluştu.",
          suggestions: ["Daha sonra tekrar deneyin."],
        },
      };
    }
  }
  async function updateSuggestions() {
    console.log("updateSuggestions");
    try {
      if (!results || !results.suggestions || !id || !userid) {
        console.error("Gerekli veriler eksik:", { results, id, userid });
        Alert.alert("Hata", "Öneriler veya bitki bilgileri eksik");
        return;
      }

      await updatePlantSuggestions(userid, id, results.suggestions);
      Alert.alert("Başarılı", "Bitki önerileri güncellendi");
      router.replace({
        pathname: "/myPlants",
        params: { refresh: "true" }, // burada query param olarak gönderiyoruz
      });
    } catch (error) {
      console.error("Öneri güncelleme hatası:", error);
      Alert.alert("Hata", "Bitki önerileri güncellenemedi");
    }
  }
  // Plant verisinin hazır olmasını bekleyen ikinci useEffect
  useEffect(() => {
    // Plant verisi hazır olduğunda analiz işlemini başlat
    if (plant && photoUri) {
      (async () => {
        try {
          const out = await classifyImage(photoUri);
          const advice = await adviseFromClass(
            out.class,
            Math.max(...out.probs)
          );

          setResults({
            disease: out.class,
            confidence: Math.max(...out.probs),
            paragraph: advice.paragraph,
            suggestions: advice.suggestions,
          });
          setLoading(false);
        } catch (e) {
          alert("Analiz hatası: " + e.message);
          console.log("FETCH HATASI:", e);
          router.back();
        }
      })();
    }
  }, [plant, photoUri]); // Her iki verinin de değişimini izleyin
  // Fonksiyonu güven değerini ve plant objesini parametre olarak alacak şekilde değiştir
  async function adviseFromClass(cls, confidence) {
    // plant objesi var ve içi dolu mu kontrol et
    const species = plant?.species || "bilinmeyen tür";
    const notes = plant?.notes?.join(", ") || "not yok";

    switch (cls) {
      case "rust":
        const rustRes = await groqChat(
          `Kullanıcının bitkisi ${confidence} güvenle ${cls} hastalığına sahip. Bitkisinin türü ise ${species}. Kullanıcıya bitkisinin hastalığı, türü ve kullanıcının bitki için aldığı şu notları göz önünde bulundurarak önerilerde bulun: "${notes}".`
        );
        return rustRes;

      case "powdery":
        const powderyRes = await groqChat(
          `Kullanıcının bitkisi ${confidence} güvenle ${cls} hastalığına sahip. Bitkisinin türü ise ${species}. Kullanıcıya bitkisinin hastalığı, türü ve kullanıcının bitki için aldığı şu notları göz önünde bulundurarak önerilerde bulun: "${notes}".`
        );
        return powderyRes;

      default:
        const res = await groqChat(
          `Kullanıcının bitkisi ${confidence} güvenle hastalığı yok. Bitkinin türü ise ${species}. Kullanıcıya önerilerde bulun. Bunu yaparken bitkinin türünü ve kullanıcının bitki için aldığı şu notları göz önünde bulundur: "${notes}".`
        );
        return res;
    }
  }

  // Sohbet mesajlarını oluştur
  const createChatMessages = () => {
    // Kullanıcı mesajı her zaman gösterilmeli
    const baseMessages = [
      {
        id: 1,
        text: "Bitkimin yapraklarını analiz edebilir misin?",
        isUser: true,
        timestamp: "Şimdi",
      },
    ];

    // Loading durumundaysa sadece yükleniyor mesajı göster
    if (loading) {
      return [
        ...baseMessages,
        {
          id: 2,
          text: "Bitkiyi analiz ediyorum...",
          isUser: false,
          timestamp: "Şimdi",
          isLoading: true,
        },
      ];
    }

    // Loading bittiyse ve sonuçlar hazırsa tüm mesajları göster
    if (results) {
      const messages = [
        ...baseMessages,
        {
          id: 2,
          text: `Bitkinizi analiz ettim. ${
            results.disease === "healthy"
              ? "Bitkinin sağlıklı görünüyor!"
              : `Bitkinde ${results.disease} hastalığı tespit ettim.`
          }`,
          isUser: false,
          timestamp: "Şimdi",
        },
        {
          id: 3,
          text: `Sonuçların doğruluk oranı: ${(
            results.confidence * 100
          ).toFixed(0)}%`,
          isUser: false,
          timestamp: "Şimdi",
        },
        {
          id: 4,
          text: results.paragraph || "Analiz sonucu hazırlanıyor...",
          isUser: false,
          timestamp: "Şimdi",
        },
      ];

      if (results.suggestions && results.suggestions.length > 0) {
        const suggestionMessages = results.suggestions.map(
          (suggestion, index) => ({
            id: 5 + index,
            text: `• ${suggestion}`,
            isUser: false,
            timestamp: "Şimdi",
          })
        );

        return [...messages, ...suggestionMessages];
      }

      return messages;
    }

    return baseMessages;
  };

  const messages = createChatMessages();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Üstteki bitki resmi kartını kaldırdım */}
        <ThemedTitle style={styles.title}>Planty Yaprak Analizi</ThemedTitle>
        <ThemedCard style={{ padding: 20, borderRadius: 20 }}>
          <View style={styles.chatContainer}>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageRow}>
                {/* Bot mesajları için profil resmi */}
                {!message.isUser && (
                  <View style={styles.avatarContainer}>
                    <View
                      style={[styles.avatar, { backgroundColor: theme.accent }]}
                    >
                      <Image
                        source={message.isLoading ? Thinking : Asistant}
                        style={styles.avatarImage}
                      />
                    </View>
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.botMessage,
                    {
                      backgroundColor: message.isUser
                        ? theme.accent
                        : theme.secondBg,
                    },
                  ]}
                >
                  {message.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ThemedText style={styles.messageText}>
                        Bitkiyi analiz ediyorum
                      </ThemedText>
                      <LoadingDots />
                    </View>
                  ) : (
                    <>
                      {/* Kullanıcının mesajı içine fotoğrafı ekle */}
                      {message.isUser && (
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.messagePlantImage}
                        />
                      )}
                      <ThemedText style={[styles.messageText, ,]}>
                        {message.text}
                      </ThemedText>
                    </>
                  )}
                  <ThemedText style={styles.timestamp}>
                    {message.timestamp}
                  </ThemedText>
                </View>

                {/* Kullanıcı mesajları için profil resmi */}
                {message.isUser && (
                  <View style={styles.avatarContainer}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.secondBg },
                      ]}
                    >
                      <Ionicons name="person" size={16} color={theme.text} />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ThemedCard>

        <View style={styles.buttons}>
          <ThemedButton
            title="Önerileri Kaydet"
            onPress={() => updateSuggestions()}
          />
          <ThemedButton title="Ana Sayfa" onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Yükleniyor animasyonunu gösteren bileşen
const LoadingDots = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <ThemedText style={styles.loadingDots}>{dots}</ThemedText>;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  chatContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: "70%", // Biraz daraltıyoruz çünkü yanında profil resmi olacak
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    marginLeft: "auto", // Sağda hizalamak için
  },
  botMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    marginRight: "auto", // Solda hizalamak için
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    alignSelf: "flex-end",
  },
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
  // styles içine ekleyin
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDots: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 4,
    minWidth: 24,
  },
  messagePlantImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
});
