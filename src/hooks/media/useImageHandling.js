import { useState } from "react";
import { Alert } from "react-native";
import wsService from "../../services/wsService";
import chatService from "../../services/chatService";

export const useImageHandling = (
  connectionStatus,
  setMessages,
  setInputText,
  flatListRef
) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = async () => {
    const result = await chatService.pickImage();
    if (result) {
      setSelectedImage(result);
    }
  };

  const takePhoto = async () => {
    const result = await chatService.takePhoto();
    if (result) {
      setSelectedImage(result);
    }
  };

  const analyzeImage = async (inputText) => {
    if (!selectedImage || connectionStatus !== "connected") {
      console.log(
        "⚠️ Image analizi iptal edildi - image yok veya bağlantı yok"
      );
      return;
    }

    try {
      setIsAnalyzing(true);

      // Preview build debug
      console.log("🔧 analyzeImage başlıyor");
      console.log("🔧 Thread ID mevcut durumu:", wsService.threadId);

      // Eğer henüz thread yoksa, thread oluştur
      if (!wsService.threadId) {
        console.log("🧵 Fotoğraf analizi için thread oluşturuluyor...");
        await wsService.initializeThread();

        // Thread oluşturulduktan sonra bekle
        let waitCount = 0;
        while (!wsService.threadId && waitCount < 10) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          waitCount++;
          console.log(`⏳ Thread oluşturma bekleniyor... ${waitCount}/10`);
        }

        if (!wsService.threadId) {
          console.error("❌ Thread oluşturulamadı!");
          throw new Error("Thread oluşturulamadı");
        }

        console.log("✅ Thread oluşturuldu:", wsService.threadId);
      }

      // Kullanıcı mesajını ekle (fotoğraf ve metin)
      const userMessage = chatService.createUserMessage(
        inputText,
        selectedImage.uri
      );

      console.log("➕ Kullanıcı mesajı ekleniyor:", userMessage.id);

      setMessages((prev) => {
        console.log(
          "🔧 setMessages çağrıldı - Önceki:",
          prev.length,
          "Yeni:",
          prev.length + 1
        );
        return [...prev, userMessage];
      });

      // Fotoğraf analizi yap
      const analysisResult = await chatService.analyzeImage(
        selectedImage,
        inputText
      );

      console.log("📥 Analiz sonucu:", analysisResult);

      // WebSocket mesajları zaten useChat hook'unda işleniyor
      // HTTP response'dan ayrıca mesaj eklemeye gerek yok
      if (
        analysisResult &&
        (analysisResult.assistant || analysisResult.message_id)
      ) {
        console.log("✅ Analiz başarılı, WebSocket mesajları bekleniyor...");
      }

      // Input ve seçili fotoğrafı temizle
      setInputText("");
      setSelectedImage(null);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("🚨 Fotoğraf analizi hatası:", error);
      Alert.alert("Hata", "Fotoğraf analizi yapılırken bir hata oluştu");

      // Error durumunda da input ve image'ı temizle
      setInputText("");
      setSelectedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  return {
    selectedImage,
    setSelectedImage,
    isAnalyzing,
    pickImage,
    takePhoto,
    analyzeImage,
    removeSelectedImage,
  };
};
