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
    if (!selectedImage || connectionStatus !== "connected") return;

    try {
      setIsAnalyzing(true);

      // Eğer henüz thread yoksa, thread oluştur
      if (!wsService.threadId) {
        console.log("🧵 Fotoğraf analizi için thread oluşturuluyor...");
        await wsService.initializeThread();
      }

      // Kullanıcı mesajını ekle (fotoğraf ve metin)
      const userMessage = chatService.createUserMessage(
        inputText,
        selectedImage.uri
      );
      setMessages((prev) => [...prev, userMessage]);

      // Fotoğraf analizi yap
      const analysisResult = await chatService.analyzeImage(
        selectedImage,
        inputText
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

        console.log("✅ Normal chat analiz mesajı ekleniyor:", analysisMessage);
        setMessages((prev) => [...prev, analysisMessage]);
      }

      // Input ve seçili fotoğrafı temizle
      setInputText("");
      setSelectedImage(null);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf analizi yapılırken bir hata oluştu");
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
