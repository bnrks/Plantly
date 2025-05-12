import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "../../../components/ThemedCard";

export default function AddPlantScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [showOptions, setShowOptions] = useState(false);

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
      setPhoto(result.assets[0].uri);
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
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    console.log({ photo, name, species, description });
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={{ height: "90%", margin: 10, borderRadius: 20 }}>
        <ScrollView contentContainerStyle={styles.content}>
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
          {photo && <Image source={{ uri: photo }} style={styles.preview} />}

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
          <TextInput
            style={styles.input}
            placeholder="Bitkinin türü"
            value={name}
            onChangeText={setName}
          />

          {/* Açıklama */}
          <ThemedText style={styles.label}>Açıklama</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Kısa açıklama"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Kaydet Butonu */}
          <ThemedButton
            title="Analize Gönder"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </ScrollView>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    marginTop: 20,
  },
});
