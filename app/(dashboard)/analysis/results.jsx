// app/analysis/results.js
import { useEffect, useState, useContext } from "react";
import { StyleSheet, View, Image, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedCard from "../../../components/ThemedCard";
import ThemedButton from "../../../components/ThemedButton";
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
import { updatePlantDisease } from "../../../src/services/firestoreService";
export default function AnalysisResults() {
  const { user } = useContext(AuthContext);
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

  // User yoksa erken return
  if (!user) {
    return null;
  }

  const userid = user.uid;

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
  useEffect(() => {
    if (results && results.disease && plant && plant.id && userid) {
      // Bitkinin analiz hastalığını Firebase'e yaz
      updatePlantDisease(userid, plant.id, results.disease)
        .then(() => console.log("Bitki hastalık durumu güncellendi"))
        .catch((e) => console.error("Durum güncellenemedi:", e));
    }
    // Sadece ilk sonuç geldiğinde çalışsın diye dependency'e results.disease ekle
  }, [results?.disease]);
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
    if (cls === "healthy") {
      // Healthy scenario
      return await groqChat(
        `The user's plant is healthy with a confidence score of ${confidence}. ` +
          `Plant species: ${species}. ` +
          `User notes: "${notes}". ` +
          `Please provide general care and growth recommendations.`
      );
    } else {
      // Disease scenario (regardless of which disease)
      return await groqChat(
        `The user's plant is diagnosed with **${cls}** with a confidence score of ${confidence}. ` +
          `Start by simply explaining: "Bitkinizin sahip olduğu hastalık...(in turkish) " If possible, also include the Turkish name of the disease in parentheses. ` +
          `Plant species: ${species}. ` +
          `User notes: "${notes}". ` +
          `Give care and treatment suggestions appropriate to the disease and plant species.`
      );
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
          text: results.paragraph || "Analiz sonucu hazırlanıyor...",
          isUser: false,
          timestamp: "Şimdi",
        },
      ];

      if (results.suggestions && results.suggestions.length > 0) {
        const suggestionMessages = results.suggestions.map(
          (suggestion, index) => ({
            id: 3 + index,
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
      {/* Üstteki bitki resmi kartını kaldırdım */}
      <ThemedTitle style={styles.title}>Planty Yaprak Analizi</ThemedTitle>
      <ThemedCard
        style={{ paddingVertical: 25, borderRadius: 20, marginHorizontal: 10 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="automatic"
        >
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
        </ScrollView>
      </ThemedCard>

      <View style={styles.buttons}>
        <ThemedButton
          title="Önerileri Kaydet"
          onPress={() => updateSuggestions()}
        />
        <ThemedButton
          title="Ana Sayfa"
          onPress={() => router.replace("/home")}
        />
      </View>

      {/* Alt boşluk ekleyelim */}
      <View style={styles.bottomSpacer} />
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
  container: { flex: 1, paddingTop: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, marginVertical: 10 },
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
  bottomSpacer: {
    height: 50, // İstediğiniz yüksekliğe göre ayarlayın
    width: "100%",
  },
});
