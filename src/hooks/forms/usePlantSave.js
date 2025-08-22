import { useState } from "react";
import { uploadImageAsync } from "../../services/storageService";
import { addPlant } from "../../services/firestoreService";

export const usePlantSave = (
  user,
  router,
  showSuccess,
  showError,
  hideAlert
) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    if (isSaving) return;

    const { photoUri, name, species, description, notes, intervalDays } =
      formData;

    try {
      setIsSaving(true);

      // 1) Fotoğrafı Storage'a yükle
      const imageUrl = await uploadImageAsync(photoUri, `plants/${user.uid}`);
      console.log("Yüklenen fotoğraf URL'si:", imageUrl);

      // 2) Firestore'a kaydet
      console.log("addPlant çağrıldı, userId:", user.uid);
      await addPlant(user.uid, {
        name,
        species,
        description,
        imageUrl,
        notes,
        wateringInterval: intervalDays,
      });

      setIsSaving(false);

      showSuccess("Başarılı", "Bitki eklendi.", () => {
        hideAlert();
        router.replace({
          pathname: "/myPlants",
          params: { refresh: "true" },
        });
      });

      return true; // Başarılı kaydetme
    } catch (e) {
      console.error(e);
      showError("Hata", "Bitki eklenirken bir sorun oluştu.");
      setIsSaving(false);
      return false; // Başarısız kaydetme
    }
  };

  return {
    isSaving,
    handleSave,
  };
};
