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
        // Eğer array döndüyse (notes varsa), her mesajı ayrı ayrı ekle
        if (Array.isArray(processedMessage)) {
          const newMessages = processedMessage.filter((msg) => {
            // Aynı ID'li mesaj zaten var mı kontrol et
            const existingMessage = prev.find(
              (existingMsg) => existingMsg.id === msg.id
            );
            if (existingMessage) {
              console.log("⚠️ Aynı ID'li mesaj zaten mevcut:", msg.id);
              return false;
            }
            return true;
          });

          if (newMessages.length > 0) {
            console.log(
              "➕ Yeni mesajlar ekleniyor:",
              newMessages.map((m) => m.id)
            );
            return [...prev, ...newMessages];
          }
          return prev;
        } else {
          // Tek mesaj durumu
          const existingMessage = prev.find(
            (msg) => msg.id === processedMessage.id
          );
          if (existingMessage) {
            console.log(
              "⚠️ Aynı ID'li mesaj zaten mevcut:",
              processedMessage.id
            );
            return prev;
          }

          console.log("➕ Yeni mesaj ekleniyor:", processedMessage.id);
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

  // Analiz modunda gelinen görüntüyü işle
  useEffect(() => {
    if (
      analysisMode === "true" &&
      analysisImage &&
      connectionStatus === "connected"
    ) {
      // Analiz modundaki görüntüyü normal chat formatında işle
      const processAnalysisImage = async () => {
        try {
          // Kullanıcı mesajını önce ekle
          const userMessage = chatService.createUserMessage(
            "Bitkimin analizi için fotoğraf gönderiyorum.",
            analysisImage
          );
          setMessages((prev) => [...prev, userMessage]);

          // Thread henüz yoksa, bekle ve oluştur
          if (!wsService.threadId) {
            console.log("🧵 Analiz için thread oluşturuluyor...");
            await wsService.initializeThread();

            // Thread oluşturulduktan sonra kısa süre bekle
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // selectedImage formatında hazırla
          const imageForAnalysis = {
            uri: analysisImage,
            type: "image/jpeg",
          };

          // Normal chat'teki fotoğraf analizi akışını kullan
          const analysisResult = await chatService.analyzeImage(
            imageForAnalysis,
            "Bitkimin analizi için fotoğraf gönderiyorum."
          );

          // HTTP response'tan gelen sonucu direkt işle
          if (analysisResult && analysisResult.assistant) {
            const analysisMessage = {
              id:
                analysisResult.message_id ||
                analysisResult.assistant.message_id ||
                Date.now().toString(),
              role: "assistant",
              content: analysisResult.assistant.content,
              timestamp: new Date(),
              diagnosis: analysisResult.diagnosis,
            };

            console.log("✅ Analiz mesajı ekleniyor:", analysisMessage);
            setMessages((prev) => [...prev, analysisMessage]);
          }

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error("❌ Analiz hatası:", error);
          Alert.alert("Hata", "Fotoğraf analizi yapılırken bir hata oluştu");
        }
      };

      processAnalysisImage();
    }
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

  const startNewChat = () => {
    // Chat'i temizle
    clearChat();

    // WebSocket'i yeniden başlat ve yeni thread oluştur
    wsService.disconnect();
    setTimeout(() => {
      wsService.connect();
    }, 500);
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
