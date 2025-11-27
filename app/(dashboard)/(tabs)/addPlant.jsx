import { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ThemedButton from "../../../components/ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "../../../components/ThemedCard";
import { AuthContext } from "../../../src/context/AuthContext";
import { useRouter } from "expo-router";
import Header from "../../../components/Header";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../src/hooks/ui/useCustomAlert";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import { addPlantStyles as styles } from "../../../css/addPlantStyles";
import { useImagePicker } from "../../../src/hooks/media/useImagePicker";
import { useSpeciesSuggestions } from "../../../src/hooks/forms/useSpeciesSuggestions";
import { useNotes } from "../../../src/hooks/forms/useNotes";
import { usePlantForm } from "../../../src/hooks/forms/usePlantForm";
import { usePlantSave } from "../../../src/hooks/forms/usePlantSave";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddPlantScreen({}) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { alertConfig, showSuccess, showError, showWarning, hideAlert } =
    useCustomAlert();
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // User yoksa erken return
  if (!user) {
    return null;
  }

  // Custom hooks
  const {
    photoUri,
    showOptions,
    photoPressed,
    setPhotoPressed,
    pickImage,
    takePhoto,
    removePhoto,
    openImageOptions,
    closeImageOptions,
  } = useImagePicker();

  const {
    species,
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
  } = useSpeciesSuggestions();

  const {
    notes,
    noteText,
    setNoteText,
    handleAddNote,
    handleRemoveNote,
    clearAllNotes,
  } = useNotes();

  const {
    name,
    setName,
    description,
    setDescription,
    wateringInterval,
    setWateringInterval,
    clearForm,
    validateForm,
  } = usePlantForm();

  const { isSaving, handleSave } = usePlantSave(
    user,
    router,
    showSuccess,
    showError,
    hideAlert
  );

  const onSave = async () => {
    const validation = validateForm(photoUri, species, notes);

    if (!validation.isValid) {
      showWarning(t('plants.missingInfo'), validation.message);
      return;
    }

    const success = await handleSave({
      photoUri,
      name,
      species,
      description,
      notes,
      intervalDays: validation.intervalDays,
    });

    if (success) {
      // Formu temizle
      clearForm();
      clearAllNotes();
      removePhoto();
      closeImageOptions();
    }
  };

  return (
    <ThemedView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      safe={true}
    >
      <Header />
      <ThemedTitle style={styles.header}>{t('plants.addPlant')}</ThemedTitle>
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
          onScrollBeginDrag={() => hideSuggestions()}
        >
          
          

          {/* Fotoğraf Ekleme + */}
         
          {/* Fotoğraf varsa fotoğrafı göster, yoksa ekleme alanını göster */}
          {photoUri ? (
            <Pressable
              style={styles.photoAddButton}
              onPress={() => openImageOptions()}
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
                    {t('plants.change')}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#E53935" />
                </TouchableOpacity>
              </View>
            </Pressable>
          ) : (
            <TouchableOpacity
              style={styles.photoAddButton}
              onPress={() => openImageOptions()}
            >
              <View style={styles.photoContainer}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={theme.thirdBg}
                />
                <ThemedText style={styles.photoText}>{t('plants.addPhoto')}</ThemedText>
                <ThemedText style={styles.photoSubtext}>
                  {t('plants.tapToSelectPhoto')}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

          {/* Seçenek Modalı */}
          <Modal
            visible={showOptions}
            transparent
            animationType="fade"
            onRequestClose={() => closeImageOptions()}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => closeImageOptions()}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    closeImageOptions();
                    pickImage();
                  }}
                >
                  <Text style={styles.modalText}>{t('plants.selectFromGallery')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    closeImageOptions();
                    takePhoto();
                  }}
                >
                  <Text style={styles.modalText}>{t('plants.camera')}</Text>
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
              {t('plants.plantName')}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder={t('plants.plantNamePlaceholder')}
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
              {t('plants.species')}
            </ThemedText>
            <View style={styles.speciesContainer}>
              <TextInput
                ref={speciesInputRef}
                style={styles.input}
                placeholder={t('plants.speciesPlaceholder')}
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
              {t('plants.description')}
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('plants.descriptionPlaceholder')}
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
              {t('plants.wateringInterval')}
            </ThemedText>
            <View style={styles.wateringInputContainer}>
              <TextInput
                style={[styles.input, styles.wateringInput]}
                placeholder={t('plants.howManyDays')}
                placeholderTextColor="#999"
                value={wateringInterval}
                onChangeText={setWateringInterval}
                keyboardType="numeric"
                maxLength={3}
              />
              <ThemedText style={styles.wateringUnit}>{t('plants.days')}</ThemedText>
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
              {t('plants.notes')}
            </ThemedText>
            <View style={styles.noteInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('plants.addNote')}
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
      <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
        <ThemedButton
          title={isSaving ? t('common.loading') : t('common.save')}
          onPress={onSave}
          style={[
            styles.saveButton,
            isSaving && { opacity: 0.6 },
            { backgroundColor: theme.thirdBg },
          ]}
          textStyle={{ fontSize: 18, fontWeight: "700" }}
          disabled={isSaving}
        />
      </View>

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
