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
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";

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
  const [wateringInterval, setWateringInterval] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState(""); // geçici not girişi
  const [showOptions, setShowOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPressed, setPhotoPressed] = useState(false);

  // Tür önerileri için state'ler
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [touchingSuggestion, setTouchingSuggestion] = useState(false);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  // TextInput ref
  const speciesInputRef = useRef(null);

  // Species state değişimini izle
  useEffect(() => {
    console.log("🔄 Species state güncellendi:", species);
  }, [species]);

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
    if (
      !photoUri ||
      !name.trim() ||
      !species.trim() ||
      !wateringInterval.trim()
    ) {
      showWarning(
        "Eksik Bilgi",
        "Lütfen fotoğraf, isim, tür ve sulama aralığı girin."
      );
      return;
    }

    // Sulama aralığının sayı olduğunu kontrol et
    const intervalDays = parseInt(wateringInterval);
    if (isNaN(intervalDays) || intervalDays <= 0) {
      showWarning(
        "Geçersiz Değer",
        "Sulama aralığı pozitif bir sayı olmalıdır."
      );
      return;
    }

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

      // 3) Formu temizle
      setPhotoUri(null);
      setName("");
      setSpecies("");
      setDescription("");
      setWateringInterval("");
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
      <ThemedCard
        style={{
          maxHeight: "70%",
          margin: 10,
          borderRadius: 20,
          paddingVertical: 10,
        }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          onScrollBeginDrag={() => setShowSuggestions(false)}
        >
          <ThemedTitle style={styles.header}>Bitki Ekle</ThemedTitle>
          <ThemedText style={styles.subtitle}>
            Yeni bitkini ekle ve takip et
          </ThemedText>

          {/* Fotoğraf Ekleme + */}
          <ThemedText style={styles.label}>
            <Ionicons
              name="camera"
              size={16}
              color={theme.thirdBg}
              style={{ marginRight: 13 }}
            />
            Fotoğraf
          </ThemedText>

          {/* Fotoğraf varsa fotoğrafı göster, yoksa ekleme alanını göster */}
          {photoUri ? (
            <Pressable
              style={styles.photoAddButton}
              onPress={() => setShowOptions(true)}
              onPressIn={() => setPhotoPressed(true)}
              onPressOut={() => setPhotoPressed(false)}
            >
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.preview} />
                <View
                  style={[styles.photoOverlay, photoPressed && { opacity: 1 }]}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <ThemedText style={styles.changePhotoText}>
                    Değiştir
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    setPhotoUri(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#E53935" />
                </TouchableOpacity>
              </View>
            </Pressable>
          ) : (
            <TouchableOpacity
              style={styles.photoAddButton}
              onPress={() => setShowOptions(true)}
            >
              <View style={styles.photoContainer}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={theme.thirdBg}
                />
                <ThemedText style={styles.photoText}>Fotoğraf Ekle</ThemedText>
                <ThemedText style={styles.photoSubtext}>
                  Dokunarak fotoğraf seç
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

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

          {/* İsim */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>
              <Ionicons
                name="leaf"
                size={16}
                color={theme.thirdBg}
                style={{ marginRight: 13, paddingRight: 2 }}
              />
              Bitki Adı
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Bitkinin adını girin..."
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Tür Seçimi */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>
              <Ionicons
                name="flower"
                size={16}
                color={theme.thirdBg}
                style={{ marginRight: 13 }}
              />
              Bitki Türü
            </ThemedText>
            <View style={styles.speciesContainer}>
              <TextInput
                ref={speciesInputRef}
                style={styles.input}
                placeholder="Türünü seçin veya yazın..."
                placeholderTextColor="#999"
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
                          console.log(
                            "👇 Pressable onPressIn tetiklendi:",
                            item
                          );
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
                          color={theme.thirdBg}
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Açıklama */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>
              <Ionicons
                name="document-text"
                size={16}
                color={theme.thirdBg}
                style={{ marginRight: 13 }}
              />
              Açıklama
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bitkiniz hakkında kısa açıklama..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Sulama Aralığı */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>
              <Ionicons
                name="water"
                size={16}
                color={theme.thirdBg}
                style={{ marginRight: 13 }}
              />
              Sulama Aralığı
            </ThemedText>
            <View style={styles.wateringInputContainer}>
              <TextInput
                style={[styles.input, styles.wateringInput]}
                placeholder="Kaç gün"
                placeholderTextColor="#999"
                value={wateringInterval}
                onChangeText={setWateringInterval}
                keyboardType="numeric"
                maxLength={3}
              />
              <ThemedText style={styles.wateringUnit}>gün</ThemedText>
            </View>
          </View>

          {/* Notlar */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>
              <Ionicons
                name="create"
                size={16}
                color={theme.thirdBg}
                style={{ marginRight: 13 }}
              />
              Notlar
            </ThemedText>
            <View style={styles.noteInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Yeni not ekle..."
                placeholderTextColor="#999"
                value={noteText}
                onChangeText={setNoteText}
              />
              <TouchableOpacity
                onPress={handleAddNote}
                style={styles.addNoteBtn}
              >
                <Ionicons name="add-circle" size={32} color={theme.thirdBg} />
              </TouchableOpacity>
            </View>

            {notes.length > 0 && (
              <View style={styles.notesContainer}>
                {notes.map((note, idx) => (
                  <View key={idx} style={styles.noteItem}>
                    <View style={styles.noteContent}>
                      <Ionicons
                        name="ellipse"
                        size={6}
                        color={theme.thirdBg}
                        style={{ marginTop: 8, marginRight: 13 }}
                      />
                      <ThemedText style={styles.noteText}>{note}</ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveNote(idx)}
                      style={styles.removeNoteBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
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
  header: {
    fontSize: 28,
    marginTop: 5,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
  },
  photoAddButton: {
    marginBottom: 16,
  },
  photoContainer: {
    borderWidth: 2,
    borderColor: "#A0C878",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    backgroundColor: "#F8FDF6",
    marginTop: 8,
  },
  photoText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: "#A0C878",
  },
  photoSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  previewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 12,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 20,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 4,
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 52,
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 16,
  },
  saveButton: {
    width: "90%",
    marginBottom: 60,
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  // Not ekleme satırı
  noteInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  addNoteBtn: {
    padding: 4,
  },
  // Notlar container
  notesContainer: {
    backgroundColor: "#F8FDF6",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  // Eklenen notlar listesi
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  noteText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  removeNoteBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // Tür önerileri stilleri
  speciesContainer: {
    position: "relative",
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fff",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },

  // Sulama aralığı stilleri
  wateringInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wateringInput: {
    flex: 1,
    textAlign: "center",
  },
  wateringUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#F8FDF6",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    minWidth: 60,
    textAlign: "center",
  },
});
