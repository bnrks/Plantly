import { useState } from "react";

export const usePlantForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [wateringInterval, setWateringInterval] = useState("");

  const clearForm = () => {
    setName("");
    setDescription("");
    setWateringInterval("");
  };

  const validateForm = (photoUri, species, notes) => {
    if (
      !photoUri ||
      !name.trim() ||
      !species.trim() ||
      !wateringInterval.trim()
    ) {
      return {
        isValid: false,
        message: "Lütfen fotoğraf, isim, tür ve sulama aralığı girin.",
      };
    }

    // Sulama aralığının sayı olduğunu kontrol et
    const intervalDays = parseInt(wateringInterval);
    if (isNaN(intervalDays) || intervalDays <= 0) {
      return {
        isValid: false,
        message: "Sulama aralığı pozitif bir sayı olmalıdır.",
      };
    }

    return {
      isValid: true,
      intervalDays,
    };
  };

  return {
    name,
    setName,
    description,
    setDescription,
    wateringInterval,
    setWateringInterval,
    clearForm,
    validateForm,
  };
};
