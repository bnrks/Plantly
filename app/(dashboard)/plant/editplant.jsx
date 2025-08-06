import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { AuthContext } from "../../../src/context/AuthContext";
import { ThemeContext } from "../../../src/context/ThemeContext";
import {
  fetchPlantById,
  updatePlant,
} from "../../../src/services/firestoreService";
import { Colors } from "../../../constants/Colors";
import Header from "../../../components/Header";

export default function EditPlant() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { theme: selTheme } = useContext(ThemeContext);
  const colors = selTheme === "dark" ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  // Animasyon için
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadPlantData();
  }, [id]);

  const loadPlantData = async () => {
    try {
      const data = await fetchPlantById(user.uid, id);
      setName(data.name || "");
      setSpecies(data.species || "");
      setDescription(data.description || "");
      setPhotoUri(data.imageUrl || null);
      setNotes(data.notes || []);
    } catch {
      Alert.alert("Hata", "Bitki bilgileri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galerinize erişim izni vermelisiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleAddNote = () => {
    const txt = noteText.trim();
    if (!txt) return;
    setNotes((p) => [...p, txt]);
    setNoteText("");
  };

  const handleRemoveNote = (i) =>
    setNotes((p) => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim() || !species.trim()) {
      Alert.alert("Eksik Bilgi", "İsim ve tür boş bırakılamaz.");
      return;
    }
    setSaving(true);
    try {
      await updatePlant(user.uid, id, {
        name,
        species,
        description,
        imageUrl: photoUri,
        notes,
      });
      Alert.alert("Başarılı", "Bitki güncellendi.");
      router.replace({ pathname: "/myPlants", params: { refresh: "true" } });
    } catch {
      Alert.alert("Hata", "Güncelleme sırasında bir sorun oluştu.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <ThemedText style={styles.loadingText}>
          Bitki bilgileri yükleniyor...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.mainBg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header style={{ marginTop: 40, marginBottom: -5 }} />
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.secondBg,
                opacity: fadeAnim,
                overflow: "hidden",
              },
            ]}
          >
            <ThemedTitle style={styles.title}>Bitkini Güncelle</ThemedTitle>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.image} />
                ) : (
                  <View
                    style={[
                      styles.placeholderImage,
                      { backgroundColor: colors.inputBg },
                    ]}
                  >
                    <Ionicons
                      name="image"
                      size={60}
                      color={colors.placeholder}
                    />
                  </View>
                )}
                <View
                  style={[
                    styles.imageOverlay,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <ThemedText style={styles.imageText}>
                    Fotoğraf Değiştir
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <View style={styles.formSection}>
                <ThemedTitle style={styles.sectionTitle}>
                  Temel Bilgiler
                </ThemedTitle>

                <View style={styles.fieldContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="leaf" size={20} color={colors.accent} />
                    <ThemedText style={styles.label}>Bitki Adı</ThemedText>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBg, color: colors.text },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Örn: Orkide"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="flask" size={20} color={colors.accent} />
                    <ThemedText style={styles.label}>Bitki Türü</ThemedText>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBg, color: colors.text },
                    ]}
                    value={species}
                    onChangeText={setSpecies}
                    placeholder="Örn: Phalaenopsis"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="create" size={20} color={colors.accent} />
                    <ThemedText style={styles.label}>Açıklama</ThemedText>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: colors.inputBg, color: colors.text },
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholder="Biraz açıklama ekleyin..."
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <ThemedTitle style={styles.sectionTitle}>
                  Bakım Notları
                </ThemedTitle>
                <ThemedText style={styles.sectionDescription}>
                  Bitkiniz için özel bakım notları ekleyebilirsiniz.
                </ThemedText>

                <View style={styles.fieldContainer}>
                  <View style={styles.noteRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                        },
                      ]}
                      value={noteText}
                      onChangeText={setNoteText}
                      placeholder="Bakım notu ekleyin..."
                      placeholderTextColor={colors.placeholder}
                      returnKeyType="done"
                      onSubmitEditing={handleAddNote}
                    />
                    <TouchableOpacity
                      onPress={handleAddNote}
                      style={[
                        styles.addNoteButton,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.notesContainer}>
                    {notes.length > 0 ? (
                      notes.map((note, i) => (
                        <Animated.View
                          key={i}
                          style={[
                            styles.noteItem,
                            { backgroundColor: colors.inputBg },
                          ]}
                        >
                          <View style={styles.noteContent}>
                            <Ionicons
                              name="water"
                              size={18}
                              color={colors.accent}
                            />
                            <ThemedText style={styles.noteText}>
                              {note}
                            </ThemedText>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveNote(i)}>
                            <Ionicons
                              name="close-circle"
                              size={22}
                              color={colors.danger}
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    ) : (
                      <ThemedText style={styles.emptyNotes}>
                        Henüz not eklenmedi.
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
        <ThemedButton
          title={saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
          icon={
            <Ionicons
              name="save-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          }
        />

        <ThemedButton
          title="Vazgeç"
          onPress={() => router.back()}
          style={styles.cancelBtn}
          textStyle={{ color: colors.text }}
        />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    maxHeight: "80%",
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    position: "relative",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  imageText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  formSection: {
    marginBottom: 24,
    borderRadius: 10,
    padding: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addNoteButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  notesContainer: {
    marginTop: 8,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  noteText: {
    marginLeft: 10,
    flex: 1,
  },
  emptyNotes: {
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
    padding: 16,
  },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: -20,
    marginBottom: 10,
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    height: 50,
    marginHorizontal: 10,
  },
});
