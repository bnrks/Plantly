import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { updatePlantSuggestions } from "../../services/firestoreService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

export const usePlantSelection = (showConfirm, hideAlert) => {
  const { user } = useContext(AuthContext);

  // Plant selection states
  const [showPlantSelectionModal, setShowPlantSelectionModal] = useState(false);
  const [userPlants, setUserPlants] = useState([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  // Modal açılması kontrolü
  useEffect(() => {
    if (shouldOpenModal && userPlants.length > 0) {
      setShowPlantSelectionModal(true);
      setShouldOpenModal(false);
    }
  }, [userPlants, shouldOpenModal]);

  // Modal açıldığında bitkiler yüklü değilse tekrar yükle
  useEffect(() => {
    if (
      showPlantSelectionModal &&
      userPlants.length === 0 &&
      !isLoadingPlants
    ) {
      loadUserPlants();
    }
  }, [showPlantSelectionModal, userPlants.length, isLoadingPlants]);

  // Bitkiler yükleme fonksiyonu
  const loadUserPlants = async () => {
    if (!user) return;

    setIsLoadingPlants(true);
    try {
      const plantsCol = collection(db, "users", user.uid, "plants");
      const plantsSnapshot = await getDocs(plantsCol);
      const plantsList = plantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserPlants(plantsList);
      setIsLoadingPlants(false);
    } catch (error) {
      console.error("Bitkiler yüklenirken hata:", error);
      setIsLoadingPlants(false);
      showConfirm(
        "Hata",
        "Bitkiler yüklenirken bir hata oluştu.",
        () => hideAlert(),
        () => hideAlert()
      );
    }
  };

  // Önerileri kaydet butonuna basıldığında
  const handleSaveNotes = async (notes) => {
    setSelectedNotes(notes);
    setShouldOpenModal(true);
    await loadUserPlants();
  };

  // Bitki seçildiğinde önerileri kaydet
  const saveNotesToPlant = async (plant) => {
    try {
      await updatePlantSuggestions(user.uid, plant.id, selectedNotes);
      setShowPlantSelectionModal(false);
      showConfirm(
        "Başarılı",
        `Öneriler "${plant.name}" bitkisine kaydedildi.`,
        () => hideAlert(),
        () => hideAlert()
      );
    } catch (error) {
      console.error("Öneriler kaydedilirken hata:", error);
      showConfirm(
        "Hata",
        "Öneriler kaydedilirken bir hata oluştu.",
        () => hideAlert(),
        () => hideAlert()
      );
    }
  };

  // Modal'ı kapatma fonksiyonu
  const closePlantSelectionModal = () => {
    setShowPlantSelectionModal(false);
  };

  return {
    // States
    showPlantSelectionModal,
    userPlants,
    isLoadingPlants,
    selectedNotes,

    // Functions
    handleSaveNotes,
    saveNotesToPlant,
    closePlantSelectionModal,
    loadUserPlants,
  };
};
