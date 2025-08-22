import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export const useImagePicker = () => {
  const [photoUri, setPhotoUri] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [photoPressed, setPhotoPressed] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Galeri izni gerekli!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Kamera izni gerekli!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
  };

  const openImageOptions = () => {
    setShowOptions(true);
  };

  const closeImageOptions = () => {
    setShowOptions(false);
  };

  return {
    photoUri,
    setPhotoUri,
    showOptions,
    photoPressed,
    setPhotoPressed,
    pickImage,
    takePhoto,
    removePhoto,
    openImageOptions,
    closeImageOptions,
  };
};
