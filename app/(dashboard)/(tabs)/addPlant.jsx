import { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "../../../components/ThemedCard";
import { uploadImageAsync } from "../../../src/services/storageService";
import { addPlant } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import { useRouter } from "expo-router";
import Header from "../../../components/Header";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../src/hooks/useCustomAlert";

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
export default function AddPlantScreen({}) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { alertConfig, showSuccess, showError, showWarning, hideAlert } =
    useCustomAlert();

  // User yoksa erken return
  if (!user) {
    return null;
  }

  const [photoUri, setPhotoUri] = useState(null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState(""); // geçici not girişi
  const [showOptions, setShowOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tür önerileri için state'ler
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [touchingSuggestion, setTouchingSuggestion] = useState(false);

  // TextInput ref
  const speciesInputRef = useRef(null);

  // Species state değişimini izle
  useEffect(() => {
    console.log("🔄 Species state güncellendi:", species);
  }, [species]);

  const wateringSchedule = [
    { date: "2025-05-28T09:00:00", plant: "Kaktüs" },
    { date: "2025-05-29T18:00:00", plant: "Orkide" },
  ];
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
  const handleAddNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setNotes((prev) => [...prev, text]);
    setNoteText("");
  };

  const handleRemoveNote = (idx) => {
    setNotes((prev) => prev.filter((_, i) => i !== idx));
  };

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
  const handleSave = async () => {
    if (isSaving) return;
    if (!photoUri || !name.trim() || !species.trim()) {
      showWarning("Eksik Bilgi", "Lütfen fotoğraf, isim ve tür girin.");
      return;
    }
    try {
      setIsSaving(true);

      // 1) Fotoğrafı Storage'a yükle
      const imageUrl = await uploadImageAsync(photoUri, `plants/${user.uid}`);
      console.log("Yüklenen fotoğraf URL'si:", imageUrl);
      // 2) Firestore'a kaydet
      console.log("addPlant çağrıldı, userId:", user.uid);
      await addPlant(user.uid, { name, species, description, imageUrl, notes });

      // 3) Formu temizle
      setPhotoUri(null);
      setName("");
      setSpecies("");
      setDescription("");
      setNotes([]);
      setNoteText("");
      setShowOptions(false);
      setIsSaving(false); // Kaydetme işlemi tamamlandı

      showSuccess("Başarılı", "Bitki eklendi.", () => {
        hideAlert();
        router.replace({
          pathname: "/myPlants",
          params: { refresh: "true" }, // burada query param olarak gönderiyoruz
        }); // Veya hangi sayfaya dönmek istersen
      });
    } catch (e) {
      console.error(e);
      showError("Hata", "Bitki eklenirken bir sorun oluştu.");
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <Header />
      <ThemedCard style={{ maxHeight: "77%", margin: 10, borderRadius: 20 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          onScrollBeginDrag={() => setShowSuggestions(false)}
        >
          <ThemedTitle style={styles.header}>Bitki Ekle</ThemedTitle>
          <ThemedText>Bitkinin fotoğrafını</ThemedText>

          {/* Fotoğraf Ekleme + */}
          <ThemedText style={styles.label}>Fotoğraf</ThemedText>
          <TouchableOpacity
            style={styles.photoAddButton}
            onPress={() => setShowOptions(true)}
          >
            <Ionicons name="add-circle-outline" size={48} color="#A0C878" />
          </TouchableOpacity>

          {/* Seçenek Modalı */}
          <Modal
            visible={showOptions}
            transparent
            animationType="fade"
            onRequestClose={() => setShowOptions(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setShowOptions(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowOptions(false);
                    pickImage();
                  }}
                >
                  <Text style={styles.modalText}>Galeriden Seç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowOptions(false);
                    takePhoto();
                  }}
                >
                  <Text style={styles.modalText}>Kamera</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Önizleme */}
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.preview} />
          )}

          {/* İsim */}
          <ThemedText style={styles.label}>Ad</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Bitkinin adı"
            value={name}
            onChangeText={setName}
          />

          {/* Tür Seçimi */}
          <ThemedText style={styles.label}>Tür</ThemedText>
          <View style={styles.speciesContainer}>
            <TextInput
              ref={speciesInputRef}
              style={styles.input}
              placeholder="Bitkinin türü (örn: Monstera, Kaktüs)"
              value={species}
              onChangeText={handleSpeciesChange}
              onFocus={handleSpeciesFocus}
              onBlur={handleSpeciesBlur}
            />

            {/* Öneriler Listesi */}
            {showSuggestions && filteredSpecies.length > 0 && (
              <View
                style={styles.suggestionsContainer}
                onTouchStart={() => {
                  console.log("🤏 Container onTouchStart tetiklendi");
                  setTouchingSuggestion(true);
                }}
                onTouchEnd={() => {
                  console.log("🤚 Container onTouchEnd tetiklendi");
                  // Biraz delay ile false yap
                  setTimeout(() => {
                    console.log("🔄 touchingSuggestion false yapılıyor");
                    setTouchingSuggestion(false);
                  }, 300);
                }}
              >
                <ScrollView
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={true}
                >
                  {filteredSpecies.slice(0, 5).map((item, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        pressed && { backgroundColor: "#f5f5f5" },
                      ]}
                      onPressIn={() => {
                        console.log("👇 Pressable onPressIn tetiklendi:", item);
                        setTouchingSuggestion(true);
                      }}
                      onPress={() => {
                        console.log("🎯 Pressable onPress tetiklendi:", item);
                        handleSpeciesSelect(item);
                      }}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#A0C878"
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Açıklama */}
          <ThemedText style={styles.label}>Açıklama</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Kısa açıklama"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <ThemedText style={styles.label}>Notlar</ThemedText>
          <View style={styles.noteInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Yeni not ekle"
              value={noteText}
              onChangeText={setNoteText}
            />
            <TouchableOpacity onPress={handleAddNote} style={styles.addNoteBtn}>
              <Ionicons name="add-circle-outline" size={32} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          {notes.map((note, idx) => (
            <View key={idx} style={styles.noteItem}>
              <ThemedText style={styles.noteText}>• {note}</ThemedText>
              <TouchableOpacity onPress={() => handleRemoveNote(idx)}>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#E53935"
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </ThemedCard>
      {/* Kaydet Butonu */}
      <ThemedButton
        title={isSaving ? "Kaydediliyor…" : "Kaydet"}
        onPress={handleSave}
        style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
        disabled={isSaving}
      />

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  content: { padding: 20 },
  header: { fontSize: 24, marginTop: 5 },
  label: { marginTop: 16, marginBottom: 8, fontSize: 14 },
  photoAddButton: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "80%",
  },
  modalButton: {
    paddingVertical: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#FAF6E9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#FAF6E9",
  },
  saveButton: {
    width: "90%",
    marginBottom: 50,
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  // Not ekleme satırı
  noteInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addNoteBtn: {
    marginLeft: 8,
  },

  // Eklenen notlar listesi
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    justifyContent: "space-between",
  },
  noteText: {
    fontSize: 16,
    flex: 1,
  },

  // Tür önerileri stilleri
  speciesContainer: {
    position: "relative",
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 52, // input height + 2px margin
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopWidth: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
});
