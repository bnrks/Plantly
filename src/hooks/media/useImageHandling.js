import { useState } from "react";
import { Alert } from "react-native";
import chatService from "../../services/chatService";

export const useImageHandling = (
  connectionStatus,
  setMessages,
  setInputText,
  flatListRef,
  ensureThread
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

  const analyzeImage = async (inputText, options = {}) => {
    // imageOverride: chat.jsx'ten gelen URI ile doğrudan analiz yapabilmek için
    const imageToAnalyze = options?.imageOverride || selectedImage;

    console.log("🔍 analyzeImage çağrıldı", {
      hasImageOverride: !!options?.imageOverride,
      imageToAnalyze: imageToAnalyze?.uri || imageToAnalyze,
      selectedImage: selectedImage?.uri,
      connectionStatus,
    });

    if (!imageToAnalyze || connectionStatus !== "connected") {
      console.log(
        "⚠️ Image analizi iptal edildi - image yok veya bağlantı yok",
        { imageToAnalyze, connectionStatus }
      );
      return;
    }

    // imageToAnalyze'ı normalize et (string URI veya { uri } objesi olabilir)
    const normalizedImage =
      typeof imageToAnalyze === "string"
        ? { uri: imageToAnalyze }
        : imageToAnalyze;

    try {
      setIsAnalyzing(true);

      // Thread yoksa HTTP ile oluştur
      const ensuredThreadId =
        typeof ensureThread === "function" ? await ensureThread() : null;

      // Kullanıcı mesajını ekle (fotoğraf ve metin)
      const userMessage = chatService.createUserMessage(
        inputText,
        normalizedImage.uri
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
        normalizedImage,
        inputText,
        {
          ...options,
          threadId: options?.threadId || ensuredThreadId,
        }
      );

      console.log("📥 Analiz sonucu:", analysisResult);

      // HTTP response'u chat message formatına çevirip ekle
      const processed = chatService.processWebSocketMessage(analysisResult);
      if (processed) {
        setMessages((prev) => {
          if (Array.isArray(processed)) {
            const next = [...prev];
            for (const msg of processed) {
              if (!next.some((m) => m.id === msg.id)) next.push(msg);
            }
            return next;
          }
          if (prev.some((m) => m.id === processed.id)) return prev;
          return [...prev, processed];
        });
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
