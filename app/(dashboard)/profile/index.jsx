import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { useContext, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
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

// Kayıt tarihini formatla
const formatJoinDate = (createdAt, t) => {
  if (!createdAt) return t('profile.member');
  
  const monthKeys = [
    'months.january', 'months.february', 'months.march', 'months.april',
    'months.may', 'months.june', 'months.july', 'months.august',
    'months.september', 'months.october', 'months.november', 'months.december'
  ];
  
  let date;
  if (createdAt.toDate) {
    date = createdAt.toDate();
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    date = new Date(createdAt);
  }
  
  const month = t(monthKeys[date.getMonth()]);
  const year = date.getFullYear();
  
  return t('profile.memberSinceFormat', { month, year });
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const [profile, setProfile] = useState({
    name: "",
    displayName: "",
    createdAt: null,
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
      {/* Header Row: BackButton, Header ve Settings aynı hizada */}
      <View style={styles.headerRow}>
        <BackButton style={styles.backButton} />
        <View style={styles.headerWrapper}>
          <Header />
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/(dashboard)/settings")}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ThemedCard
        style={[
          styles.profileCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <View style={styles.profileCardRow}>
          {/* Sol Kolon - Kullanıcı Bilgileri */}
          <View style={styles.profileLeftColumn}>
            <ThemedTitle style={styles.fullName}>{profile.name || t('profile.user')}</ThemedTitle>
            <ThemedText style={styles.nickname}>
              @{profile.displayName || t('profile.userLower')}
            </ThemedText>
            <ThemedText style={styles.joinDate}>
              <Ionicons name="calendar-outline" size={14} color={theme.text} /> {formatJoinDate(profile.createdAt, t)}
            </ThemedText>
            
            {/* Badges */}
            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: theme.fourthBg }]}>
                <Ionicons name="leaf" size={14} color={theme.thirdBg} />
                <ThemedText style={styles.badgeText}>{t('profile.badges.plantLover')}</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.fourthBg }]}>
                <Ionicons name="water" size={14} color="#2196F3" />
                <ThemedText style={styles.badgeText}>{t('profile.badges.wateringMaster')}</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.fourthBg }]}>
                <Ionicons name="star" size={14} color="#FFC107" />
                <ThemedText style={styles.badgeText}>{t('profile.badges.pro')}</ThemedText>
              </View>
            </View>
          </View>

          {/* Sağ Kolon - Profil Resmi */}
          <View style={styles.profileRightColumn}>
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
          </View>
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t('profile.summary.title')}</ThemedTitle>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <SummaryItem
              icon="reader-outline"
              label={t('profile.summary.completedEducation')}
              value={
                typeof profile.completedModules === "number"
                  ? t('profile.summary.modules', { count: profile.completedModules })
                  : "-"
              }
              color={theme.thirdBg}
            />
            <SummaryItem
              icon="water-outline"
              label={t('profile.summary.wateringStreak')}
              value={t('profile.summary.days', { count: profile.wateringStreak })}
              color={theme.thirdBg}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem
              icon="trophy-outline"
              label={t('profile.summary.wateringScore')}
              value={t('profile.summary.points', { count: 850 })}
              color="#FFC107"
            />
            <SummaryItem
              icon="leaf-outline"
              label={t('profile.summary.totalPlants')}
              value={
                typeof profile.plantCount === "number"
                  ? t('profile.summary.plantsCount', { count: profile.plantCount })
                  : "-"
              }
              color={theme.thirdBg}
            />
          </View>
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t('profile.favoritePlant')}</ThemedTitle>
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
                {favorite.name || t('profile.favoritePlant')}
              </ThemedTitle>
              <ThemedText style={[styles.favoriteSubtitle, { color: theme.text }]}>
                {favorite.description || t('profile.favoriteDescription')}
              </ThemedText>
            </View>
          </View>
        ) : (
          <ThemedText style={[styles.favoriteSubtitle, { color: theme.text }]}>
            {t('profile.noFavorite')}
          </ThemedText>
        )}
      </ThemedCard>

      {/* Başarımlar */}
      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>{t('profile.achievements')}</ThemedTitle>
        
        <AchievementItem
          icon="water"
          iconColor="#2196F3"
          bgColor="#E3F2FD"
          title={t('profile.achievementsList.wateringMaster.title')}
          description={t('profile.achievementsList.wateringMaster.description')}
        />
        
        <AchievementItem
          icon="leaf"
          iconColor="#4CAF50"
          bgColor="#E8F5E9"
          title={t('profile.achievementsList.plantLover.title')}
          description={t('profile.achievementsList.plantLover.description')}
        />
        
        <AchievementItem
          icon="flower"
          iconColor="#E91E63"
          bgColor="#FCE4EC"
          title={t('profile.achievementsList.greenThumb.title')}
          description={t('profile.achievementsList.greenThumb.description')}
        />
        
        <AchievementItem
          icon="school"
          iconColor="#FF9800"
          bgColor="#FFF3E0"
          title={t('profile.achievementsList.expert.title')}
          description={t('profile.achievementsList.expert.description')}
        />
      </ThemedCard>
    </ScreenContainer>
  );
}

function AchievementItem({ icon, iconColor, bgColor, title, description }) {
  return (
    <View style={styles.achievementItem}>
      <View style={[styles.achievementImageWrapper, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.achievementTextContainer}>
        <ThemedTitle style={styles.achievementTitle}>{title}</ThemedTitle>
        <ThemedText style={styles.achievementDescription}>{description}</ThemedText>
      </View>
    </View>
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
      <View style={styles.summaryTextContainer}>
        <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
        <ThemedTitle style={styles.summaryValue}>{value}</ThemedTitle>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 1,
  },
  headerWrapper: {
    flex: 1,
    alignItems: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    zIndex: 1,
    padding: 8,
  },
  profileCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginTop: 8,
  },
  profileCardRow: {
    flexDirection: "row",
    width: "100%",
  },
  profileLeftColumn: {
    flex: 1,
    justifyContent: "center",
  },
  profileRightColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  fullName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  nickname: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
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
  summaryGrid: {
    gap: 14,
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
    alignItems: "center",
    justifyContent: "flex-start",
  },
  summaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
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
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 14,
  },
  achievementImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  achievementImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
});
