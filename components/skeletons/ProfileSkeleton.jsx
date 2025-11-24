import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import SkeletonBox from "./SkeletonBox";

const ProfileSkeleton = () => {
  return (
    <ScreenContainer scrollable topSpacing={24} bottomSpacing={80}>
      <View style={styles.backPlaceholder} />
      <Header style={styles.headerImage} />

      <View style={styles.card}>
        <SkeletonBox width={82} height={82} borderRadius={41} />
        <SkeletonBox width="50%" height={18} style={styles.centered} />

        <View style={styles.metaRow}>
          <SkeletonBox width="48%" height={56} borderRadius={16} />
          <SkeletonBox width="48%" height={56} borderRadius={16} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <SkeletonBox width="40%" height={18} style={styles.sectionTitle} />
        <View style={styles.summaryRow}>
          <SkeletonBox width="48%" height={72} borderRadius={16} />
          <SkeletonBox width="48%" height={72} borderRadius={16} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <SkeletonBox width="40%" height={18} style={styles.sectionTitle} />
        <View style={styles.favoriteRow}>
          <SkeletonBox width={60} height={60} borderRadius={16} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="60%" height={16} />
            <SkeletonBox width="80%" height={14} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default ProfileSkeleton;

const styles = StyleSheet.create({
  backPlaceholder: {
    width: 24,
    height: 24,
  },
  headerImage: {
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  centered: {
    alignSelf: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  sectionCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
    gap: 14,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
