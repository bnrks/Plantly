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

  useEffect(() => {
    (async () => {
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
    })();
  }, [id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galerinize erişim izni vermelisiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
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
      <ThemedView style={styles.loading}>
        <ThemedText>Yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.mainBg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.secondBg }]}>
            <ThemedTitle style={styles.title}>Bitki Düzenle</ThemedTitle>

            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.image} />
            )}
            <ThemedButton title="Resmi Değiştir" onPress={pickImage} />

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Ad</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg }]}
                value={name}
                onChangeText={setName}
                placeholder="Bitkinin adı"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Tür</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg }]}
                value={species}
                onChangeText={setSpecies}
                placeholder="Bitkinin türü"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Açıklama</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.inputBg },
                ]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Açıklama"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Notlar</ThemedText>
              <View style={styles.noteRow}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, backgroundColor: colors.inputBg },
                  ]}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Yeni not ekle"
                  placeholderTextColor={colors.placeholder}
                />
                <TouchableOpacity
                  onPress={handleAddNote}
                  style={styles.addNote}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={colors.accent}
                  />
                </TouchableOpacity>
              </View>
              {notes.map((n, i) => (
                <View key={i} style={styles.noteItem}>
                  <ThemedText>• {n}</ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveNote(i)}>
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <ThemedButton
              title={saving ? "Kaydediliyor…" : "Kaydet"}
              onPress={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16 },
  image: { width: "100%", height: 180, borderRadius: 8, marginBottom: 16 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  noteRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addNote: { marginLeft: 8 },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  saveBtn: { marginTop: 24 },
});
