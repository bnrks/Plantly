import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import wsService from "../../services/wsService";
import chatService from "../../services/chatService";

export const useChat = (connectionStatus) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  // Analiz parametrelerini al
  const { analysisImage, plantId, analysisMode } = useLocalSearchParams();

  useEffect(() => {
    // Mesaj dinleyicisi ekle
    const handleMessage = (data) => {
      console.log("📥 Alınan mesaj:", data);

      const processedMessage = chatService.processWebSocketMessage(data);
      if (!processedMessage) {
        console.log("⚠️ Mesaj işlenemedi, null döndü");
        return;
      }

      console.log("✅ İşlenmiş mesaj:", processedMessage);

      setMessages((prev) => {
        // Son 5 saniye içinde aynı role'den gelen mesajları kontrol et
        const now = new Date();
        const fiveSecondsAgo = new Date(now.getTime() - 5000);

        // Eğer array döndüyse (notes varsa), her mesajı ayrı ayrı ekle
        if (Array.isArray(processedMessage)) {
          const newMessages = processedMessage.filter((msg) => {
            // ID kontrolü
            const existingMessage = prev.find(
              (existingMsg) => existingMsg.id === msg.id
            );
            if (existingMessage) {
              console.log("⚠️ WebSocket duplicate ID engellendi:", msg.id);
              return false;
            }

            // Son 5 saniye içinde aynı role ve content kontrolü
            if (msg.role === "assistant" || msg.role === "assistant_notes") {
              const recentSimilar = prev.find(
                (existingMsg) =>
                  existingMsg.role === msg.role &&
                  existingMsg.timestamp &&
                  new Date(existingMsg.timestamp) > fiveSecondsAgo &&
                  (existingMsg.content === msg.content ||
                    (typeof existingMsg.content === "string" &&
                      typeof msg.content === "string" &&
                      existingMsg.content.trim() === msg.content.trim()) ||
                    (Array.isArray(existingMsg.content) &&
                      Array.isArray(msg.content) &&
                      JSON.stringify(existingMsg.content) ===
                        JSON.stringify(msg.content)))
              );
              if (recentSimilar) {
                console.log(
                  "⚠️ WebSocket duplicate recent content engellendi:",
                  msg.role,
                  "time diff:",
                  now - new Date(recentSimilar.timestamp),
                  "ms"
                );
                return false;
              }
            }

            return true;
          });

          if (newMessages.length > 0) {
            console.log(
              "➕ WebSocket yeni mesajlar ekleniyor:",
              newMessages.map((m) => m.id)
            );
            return [...prev, ...newMessages];
          }
          return prev;
        } else {
          // Tek mesaj durumu - ID kontrolü
          const existingMessage = prev.find(
            (msg) => msg.id === processedMessage.id
          );
          if (existingMessage) {
            console.log(
              "⚠️ WebSocket duplicate ID engellendi:",
              processedMessage.id
            );
            return prev;
          }

          // Son 5 saniye içinde aynı role ve content kontrolü
          if (
            processedMessage.role === "assistant" ||
            processedMessage.role === "assistant_notes"
          ) {
            const recentSimilar = prev.find(
              (existingMsg) =>
                existingMsg.role === processedMessage.role &&
                existingMsg.timestamp &&
                new Date(existingMsg.timestamp) > fiveSecondsAgo &&
                (existingMsg.content === processedMessage.content ||
                  (typeof existingMsg.content === "string" &&
                    typeof processedMessage.content === "string" &&
                    existingMsg.content.trim() ===
                      processedMessage.content.trim()) ||
                  (Array.isArray(existingMsg.content) &&
                    Array.isArray(processedMessage.content) &&
                    JSON.stringify(existingMsg.content) ===
                      JSON.stringify(processedMessage.content)))
            );
            if (recentSimilar) {
              console.log(
                "⚠️ WebSocket duplicate recent content engellendi:",
                processedMessage.role,
                "time diff:",
                now - new Date(recentSimilar.timestamp),
                "ms"
              );
              return prev;
            }
          }

          console.log(
            "➕ WebSocket yeni mesaj ekleniyor:",
            processedMessage.id
          );
          return [...prev, processedMessage];
        }
      });

      setIsTyping(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    wsService.addMessageListener(handleMessage);

    // Cleanup
    return () => {
      wsService.removeMessageListener(handleMessage);
    };
  }, []);

  // Analiz modunda direkt reconnection yap
  useEffect(() => {
    if (analysisMode === "true" && analysisImage) {
      console.log(
        "🔍 Analiz modu algılandı, WebSocket reconnection yapılıyor..."
      );

      const forceReconnect = async () => {
        try {
          // Eğer zaten bağlıysa, önce kes
          if (connectionStatus === "connected") {
            console.log("🔄 Mevcut bağlantı kesiliyor...");
            wsService.disconnect();

            // Disconnect işleminin tamamlanmasını bekle
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Yeniden bağlan
          console.log("🔗 Analiz modu için yeniden bağlanılıyor...");
          await wsService.connect();

          console.log("✅ Analiz modu için WebSocket yeniden bağlandı");
        } catch (error) {
          console.error("❌ Analiz modu reconnection hatası:", error);
        }
      };

      forceReconnect();
    }
  }, [analysisMode, analysisImage]);

  // Analiz modunda gelinen görüntüyü işle
  useEffect(() => {
    const processAnalysisFromMyPlants = async () => {
      if (
        analysisMode === "true" &&
        analysisImage &&
        connectionStatus === "connected"
      ) {
        try {
          console.log("🔍 MyPlants analiz modu başlatılıyor...");

          // Bağlantının stabil olmasını bekle
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Thread henüz yoksa, bekle ve oluştur
          if (!wsService.threadId) {
            console.log("🧵 Analiz için thread oluşturuluyor...");
            await wsService.initializeThread();

            // Thread oluşturulduktan sonra WebSocket'in hazır olmasını bekle
            let waitCount = 0;
            while (!wsService.threadId && waitCount < 15) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              waitCount++;
              console.log(`⏳ Thread bekleniyor... ${waitCount}/15`);
            }

            if (!wsService.threadId) {
              throw new Error("Thread oluşturulamadı - timeout");
            }

            console.log("✅ Thread oluşturuldu:", wsService.threadId);
          }

          // Kullanıcı mesajını önce ekle
          const userMessage = chatService.createUserMessage(
            "Bitkimin analizi için fotoğraf gönderiyorum.",
            analysisImage
          );
          setMessages((prev) => [...prev, userMessage]);

          // Typing indicator'ı göster
          setIsTyping(true);

          // selectedImage formatında hazırla
          const imageForAnalysis = {
            uri: analysisImage,
            type: "image/jpeg",
          };

          // Analiz başlat
          console.log("📸 MyPlants analizi başlatılıyor...");
          const analysisResult = await chatService.analyzeImage(
            imageForAnalysis,
            "Bitkimin analizi için fotoğraf gönderiyorum."
          );

          console.log("✅ MyPlants analizi tamamlandı:", analysisResult);

          // WebSocket mesajlarını bekle, HTTP response'u işleme
        } catch (error) {
          console.error("❌ MyPlants analiz hatası:", error);
          setIsTyping(false); // Hata durumunda typing indicator'ı kapat
          Alert.alert(
            "Analiz Hatası",
            "Bitki analizi yapılırken bir hata oluştu. Lütfen tekrar deneyin."
          );
        }
      }
    };

    processAnalysisFromMyPlants();
  }, [analysisMode, analysisImage, connectionStatus]);

  const sendMessage = async () => {
    if (!inputText.trim() || connectionStatus !== "connected") return;

    // Eğer henüz thread yoksa, thread oluştur
    if (!wsService.threadId) {
      console.log("🧵 İlk mesaj: Thread oluşturuluyor...");
      await wsService.initializeThread();
    }

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // WebSocket'e gönder
    wsService.sendUserMessage(inputText.trim());

    // Input'u temizle
    setInputText("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const clearChat = () => {
    setMessages([]);
    setInputText("");
    setIsTyping(false);
  };

  const startNewChat = async () => {
    try {
      console.log("🆕 Yeni sohbet başlatılıyor...");

      // Chat'i temizle
      clearChat();

      // WebSocket'i yeniden başlat ve yeni thread oluştur
      wsService.disconnect();

      // Kısa bir süre bekle
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Yeniden bağlan
      await wsService.connect();

      console.log("✅ Yeni sohbet başlatıldı");
    } catch (error) {
      console.error("❌ Yeni sohbet başlatma hatası:", error);

      // Error'ı rethrow et ki üst seviyede yakalanabilsin
      throw error;
    }
  };

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isTyping,
    setIsTyping,
    flatListRef,
    sendMessage,
    clearChat,
    startNewChat,
  };
};
