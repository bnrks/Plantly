import { useState } from "react";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

export const useImageCache = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const saveImageToCache = async (uri) => {
    if (!uri) return null;

    setIsProcessing(true);
    try {
      // Kalıcı klasör (/cache/uploads/) -> mutlaka var olsun
      const cacheDir = FileSystem.cacheDirectory + "uploads/";
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

      // Her seferinde aynı ada yaz: uploads/latest.jpg
      const fileName = `analysis_${Date.now()}.jpg`;
      const cacheUri = `${cacheDir}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: cacheUri,
      });

      console.log("Fotoğraf kopyalandı:", cacheUri);
      setIsProcessing(false);
      return cacheUri;
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Hata", "Görsel kaydedilirken bir hata oluştu.");
      console.error("Error saving image to cache:", error);
      return null;
    }
  };

  const deleteImageFromCache = async (uri) => {
    if (!uri) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error("Error deleting image from cache:", error);
    }
  };

  return {
    isProcessing,
    saveImageToCache,
    deleteImageFromCache,
  };
};
