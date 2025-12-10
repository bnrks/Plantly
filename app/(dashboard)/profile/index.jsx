import { View, Image, TouchableOpacity } from "react-native";
import { useContext, useState } from "react";
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
import { uploadProfilePicture } from "../../../src/services/firestoreService";
import { AuthContext } from "../../../src/context/AuthContext";
import ProfileSkeleton from "../../../components/skeletons/ProfileSkeleton";
import { useProfileData } from "../../../src/hooks/profile/useProfileData";
import {
  formatJoinDate,
  getBadgeIconInfo,
  getProgressForAchievement,
} from "../../../src/hooks/profile/useProfileHelpers";
import { profileStyles as styles } from "../../../css/profileStyles";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const {
    profile,
    setProfile,
    loading,
    userBadges,
    allBadges,
    achievements,
    achievementProgress,
    badgeIconUrls,
    achievementIconUrls,
  } = useProfileData(user?.uid);
  const [uploading, setUploading] = useState(false);

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
            
            {/* Badges - Dinamik */}
            <View style={styles.badgesContainer}>
              {userBadges.length > 0 ? (
                userBadges.slice(0, 3).map((userBadge) => {
                  const badgeInfo = allBadges.find(b => b.id === userBadge.badgeId);
                  const iconInfo = getBadgeIconInfo(userBadge.badgeId, badgeInfo?.rarity);
                  const badgeImgUrl = badgeIconUrls[userBadge.badgeId];
                  return (
                    <View 
                      key={userBadge.badgeId} 
                      style={[styles.badge, { backgroundColor: theme.thirdBg }]}
                    >
                      {badgeImgUrl ? (
                        <Image source={{ uri: badgeImgUrl }} style={{ width: 14, height: 14, borderRadius: 3 }} />
                      ) : (
                        <Ionicons name={iconInfo.icon} size={14} color={iconInfo.color} />
                      )}
                      <ThemedText style={styles.badgeText}>
                        {badgeInfo?.name || badgeInfo?.title || userBadge.badgeId}
                      </ThemedText>
                    </View>
                  );
                })
              ) : (
                <View style={[styles.badge, { backgroundColor: theme.thirdBg, opacity: 0.6 }]}>
                  <Ionicons name="ribbon-outline" size={14} color={theme.text} />
                  <ThemedText style={styles.badgeText}>{t('achievements.noBadges')}</ThemedText>
                </View>
              )}
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
              color={Colors.primary}
            />
            <SummaryItem
              icon="water-outline"
              label={t('profile.summary.wateringStreak')}
              value={t('profile.summary.days', { count: profile.wateringStreak })}
              color={Colors.primary}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem
              icon="trophy-outline"
              label={t('profile.summary.wateringScore')}
              value={
                typeof profile.wateringScore === "number"
                  ? t('profile.summary.points', { count: Math.round(profile.wateringScore) })
                  : t('profile.summary.points', { count: 0 })
              }
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
              color={Colors.primary}
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
            <View style={[styles.favoriteIcon, { backgroundColor: theme.thirdBg }]}>
              {favorite.imageUrl ? (
                <Image
                  source={{ uri: favorite.imageUrl }}
                  style={styles.favoriteImage}
                />
              ) : (
                <Ionicons name="leaf" size={28} color={Colors.primary} />
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
        
        {achievements.length > 0 ? (
          achievements.map((achievement) => {
            const progress = getProgressForAchievement(achievementProgress, achievement.id);
            const iconInfo = getBadgeIconInfo(achievement.badgeId);
            const bgColorMap = {
              watering_master: "#E3F2FD",
              plant_lover: "#E8F5E9",
              green_thumb: "#FCE4EC",
              expert: "#FFF3E0",
            };
            // Progress fallback: module_completed için counter'ı profilden kullan
            const computedProgress = (() => {
              if (achievement.actionType === 'module_completed' && achievement.progressField === 'completedModulesCount') {
                return profile.completedModulesCount || 0;
              }
              return progress.current || 0;
            })();
            
            const imageUrl = achievementIconUrls[achievement.id] || badgeIconUrls[achievement.badgeId] || null;
            return (
              <AchievementItem
                key={achievement.id}
                icon={iconInfo.icon}
                iconColor={iconInfo.color}
                bgColor={bgColorMap[achievement.badgeId] || "#F5F5F5"}
                title={achievement.name}
                description={achievement.description}
                progress={computedProgress}
                target={achievement.target || 0}
                completed={progress.completed || false}
                imageUrl={imageUrl}
              />
            );
          })
        ) : (
          <>
            {/* Fallback - Firebase'den veri gelmezse varsayılan göster */}
            <AchievementItem
              icon="water"
              iconColor="#2196F3"
              bgColor="#E3F2FD"
              title={t('profile.achievementsList.wateringMaster.title')}
              description={t('profile.achievementsList.wateringMaster.description')}
              progress={profile.wateringCount || 0}
              target={10}
              completed={false}
            />
            
            <AchievementItem
              icon="leaf"
              iconColor={Colors.primary}
              bgColor="#E8F5E9"
              title={t('profile.achievementsList.plantLover.title')}
              description={t('profile.achievementsList.plantLover.description')}
              progress={profile.plantCount || 0}
              target={1}
              completed={profile.plantCount >= 1}
            />
            
            <AchievementItem
              icon="flower"
              iconColor="#E91E63"
              bgColor="#FCE4EC"
              title={t('profile.achievementsList.greenThumb.title')}
              description={t('profile.achievementsList.greenThumb.description')}
              progress={profile.plantCount || 0}
              target={5}
              completed={profile.plantCount >= 5}
            />
            
            <AchievementItem
              icon="school"
              iconColor="#FF9800"
              bgColor="#FFF3E0"
              title={t('profile.achievementsList.expert.title')}
              description={t('profile.achievementsList.expert.description')}
              progress={profile.completedModulesCount || 0}
              target={3}
              completed={false}
            />
          </>
        )}
      </ThemedCard>
    </ScreenContainer>
  );
}

function AchievementItem({ icon, iconColor, bgColor, title, description, progress, target, completed, imageUrl }) {
  const progressPercent = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  
  return (
    <View style={styles.achievementItem}>
      <View style={[styles.achievementImageWrapper, { backgroundColor: bgColor }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.achievementImage} />
        ) : (
          <Ionicons name={icon} size={28} color={iconColor} />
        )}
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
      <View style={styles.achievementTextContainer}>
        <ThemedTitle style={styles.achievementTitle}>{title}</ThemedTitle>
        <ThemedText style={styles.achievementDescription}>{description}</ThemedText>
        {target > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: completed ? '#4CAF50' : iconColor }]} />
            </View>
            <ThemedText style={styles.progressText}>
              {progress} / {target}
            </ThemedText>
          </View>
        )}
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
