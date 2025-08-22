import { useState, useRef } from "react";

// Önceden tanımlı bitki türleri
const PREDEFINED_SPECIES = [
  "Aleo Vera",
  "Monstera Deliciosa",
  "Kaktüs",
  "Orkide",
  "Gül",
  "Lale",
  "Zambak",
  "Çiçek",
  "Ficus",
  "Sukulent",
  "Lavanta",
  "Begonia",
  "Petunya",
  "Krizantem",
  "Papatya",
  "Menekşe",
  "Sardunya",
  "Karanfil",
  "Yasemin",
  "Nergis",
  "Sümbül",
  "İris",
  "Leylak",
  "Akasya",
  "Mimoza",
  "Kamelya",
  "Azalya",
  "Rododendron",
  "Bambu",
  "Palmiye",
  "Bonsai",
  "Kekik",
  "Fesleğen",
  "Roka",
  "Marul",
  "Domates",
  "Biber",
  "Salatalık",
  "Patlıcan",
];

export const useSpeciesSuggestions = () => {
  const [species, setSpecies] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [touchingSuggestion, setTouchingSuggestion] = useState(false);
  const speciesInputRef = useRef(null);

  // Tür girişi değiştiğinde çağrılır
  const handleSpeciesChange = (text) => {
    console.log("🔤 handleSpeciesChange çağrıldı:", text);
    setSpecies(text);

    if (text.trim() === "") {
      console.log("❌ Text boş, suggestions kapatılıyor");
      setShowSuggestions(false);
      setFilteredSpecies([]);
      return;
    }

    // Girilen metne uygun önerileri filtrele
    const filtered = PREDEFINED_SPECIES.filter((species) =>
      species.toLowerCase().includes(text.toLowerCase())
    );

    console.log("🔍 Filtered species:", filtered.length, "adet");
    setFilteredSpecies(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Önerilen türe tıklandığında çağrılır
  const handleSpeciesSelect = (selectedSpecies) => {
    console.log("👆 handleSpeciesSelect çağrıldı:", selectedSpecies);
    console.log("📝 Önceki species değeri:", species);

    setSpecies(selectedSpecies);
    setShowSuggestions(false);
    setFilteredSpecies([]);
    setTouchingSuggestion(false);

    console.log("✅ Species güncellendi:", selectedSpecies);

    // Input'u tekrar focus et
    setTimeout(() => {
      if (speciesInputRef.current) {
        console.log("🔄 Input blur ediliyor");
        speciesInputRef.current.blur();
      }
    }, 100);
  };

  // Input focus olduğunda çağrılır
  const handleSpeciesFocus = () => {
    console.log("🎯 handleSpeciesFocus çağrıldı, mevcut species:", species);
    if (species.trim() !== "") {
      handleSpeciesChange(species);
    }
  };

  // Input blur olduğunda çağrılır
  const handleSpeciesBlur = () => {
    console.log(
      "😴 handleSpeciesBlur çağrıldı, touchingSuggestion:",
      touchingSuggestion
    );
    // Daha uzun bir delay vererek suggestion'a tıklama işlemini tamamlamasını sağlayalım
    setTimeout(() => {
      if (!touchingSuggestion) {
        console.log("🚫 Suggestions kapatılıyor (blur)");
        setShowSuggestions(false);
      } else {
        console.log("⏳ Blur iptal edildi çünkü suggestion'a dokunuluyor");
      }
    }, 500); // Delay'i 500ms'ye çıkardık
  };

  const hideSuggestions = () => {
    setShowSuggestions(false);
  };

  return {
    species,
    setSpecies,
    showSuggestions,
    filteredSpecies,
    touchingSuggestion,
    setTouchingSuggestion,
    speciesInputRef,
    handleSpeciesChange,
    handleSpeciesSelect,
    handleSpeciesFocus,
    handleSpeciesBlur,
    hideSuggestions,
  };
};
