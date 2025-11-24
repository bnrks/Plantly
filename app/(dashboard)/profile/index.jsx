import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { useContext, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "../../../components/ThemedCard";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Header from "../../../components/Header";
import BackButton from "../../../components/BackButton";
import ScreenContainer from "../../../components/ScreenContainer";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import {
  fetchUserProfileWithFavorite,
  fetchUserPlantCount,
  uploadProfilePicture,
} from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import ProfileSkeleton from "../../../components/skeletons/ProfileSkeleton";

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const [profile, setProfile] = useState({
    displayName: "",
    wateringStreak: 0,
    plantCount: null,
    favoritePlant: null,
    completedModules: null,
    userPictureUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const [profileData, plantCount] = await Promise.all([
          fetchUserProfileWithFavorite(user.uid),
          fetchUserPlantCount(user.uid),
        ]);

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            ...profileData,
            plantCount,
          }));
        }
      } catch (error) {
        console.error("Profil bilgisi cekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  const handleChangePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;
      if (!user?.uid) return;

      setUploading(true);
      const downloadUrl = await uploadProfilePicture(user.uid, result.assets[0].uri);
      if (downloadUrl) {
        setProfile((prev) => ({ ...prev, userPictureUrl: downloadUrl }));
      }
    } catch (error) {
      console.error("Profil resmi guncellenirken hata:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const favorite = profile.favoritePlant;

  return (
    <ScreenContainer scrollable topSpacing={24} bottomSpacing={80}>
      <BackButton style={styles.backButton} />
      <Header style={styles.headerImage} />

      <ThemedCard
        style={[
          styles.profileCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={
              profile.userPictureUrl
                ? { uri: profile.userPictureUrl }
                : require("../../../assets/plantly-logo.png")
            }
            style={styles.avatar}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.editAvatar}
            onPress={handleChangePhoto}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <Ionicons
              name={uploading ? "time-outline" : "create-outline"}
              size={18}
              color={theme.background}
            />
          </TouchableOpacity>
        </View>
        <ThemedTitle style={styles.userName}>
          {profile.displayName || "Kullanici"}
        </ThemedTitle>

        <View style={styles.metaRow}>
          <MetaItem
            icon="flame-outline"
            label="Sulama serisi"
            value={`${profile.wateringStreak} gun`}
            color={theme.thirdBg}
          />
          <MetaItem
            icon="leaf-outline"
            label="Bitki sayisi"
            value={
              typeof profile.plantCount === "number"
                ? `${profile.plantCount}`
                : "-"
            }
            color={theme.thirdBg}
          />
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>Profil Ozeti</ThemedTitle>
        <View style={styles.summaryRow}>
          <SummaryItem
            icon="reader-outline"
            label="Tamamlanan Egitim"
            value={
              typeof profile.completedModules === "number"
                ? `${profile.completedModules} modul`
                : "-"
            }
            color={theme.thirdBg}
          />
          <SummaryItem
            icon="water-outline"
            label="Sulama serisi"
            value={`${profile.wateringStreak} gun`}
            color={theme.thirdBg}
          />
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>Favori Bitki</ThemedTitle>
        {favorite ? (
          <View style={styles.favoriteCard}>
            <View style={[styles.favoriteIcon, { backgroundColor: theme.fourthBg }]}>
              {favorite.imageUrl ? (
                <Image
                  source={{ uri: favorite.imageUrl }}
                  style={styles.favoriteImage}
                />
              ) : (
                <Ionicons name="leaf" size={28} color={theme.thirdBg} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <ThemedTitle style={styles.favoriteTitle}>
                {favorite.name || "Favori bitki"}
              </ThemedTitle>
              <ThemedText style={[styles.favoriteSubtitle, { color: theme.text }]}>
                {favorite.description || "En cok ilgilendigigin bitki"}
              </ThemedText>
            </View>
          </View>
        ) : (
          <ThemedText style={[styles.favoriteSubtitle, { color: theme.text }]}>
            Henuz favori bitkin yok.
          </ThemedText>
        )}
      </ThemedCard>
    </ScreenContainer>
  );
}

function MetaItem({ icon, label, value, color }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ marginLeft: 8 }}>
        <ThemedText style={styles.metaLabel}>{label}</ThemedText>
        <ThemedTitle style={styles.metaValue}>{value}</ThemedTitle>
      </View>
    </View>
  );
}

function SummaryItem({ icon, label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <View
        style={[
          styles.summaryIconWrapper,
          { backgroundColor: color },
        ]}
      >
        <Ionicons name={icon} size={20} color="#ffffff" />
      </View>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedTitle style={styles.summaryValue}>{value}</ThemedTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  headerImage: {
    marginTop: 16,
    marginBottom: 12,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 8,
  },
  avatarWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(83,115,84,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  editAvatar: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#537354",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(83,115,84,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  metaLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  metaValue: {
    fontSize: 14,
  },
  sectionCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(83,115,84,0.08)",
  },
  summaryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
  },
  favoriteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  favoriteIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  favoriteTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  favoriteSubtitle: {
    fontSize: 14,
  },
  favoriteImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
