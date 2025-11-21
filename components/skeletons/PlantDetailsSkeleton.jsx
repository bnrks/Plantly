import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import ThemedCard from "../ThemedCard";
import SkeletonBox from "./SkeletonBox";

const PlantDetailsSkeleton = () => {
  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      bottomSpacing={80}
    >
      <Header style={{ marginTop: 10 }} />

      <View style={styles.backRow}>
        <SkeletonBox width={42} height={42} borderRadius={20} />
      </View>

      <ThemedCard style={styles.card}>
        <SkeletonBox height={200} borderRadius={16} />

        <View style={styles.section}>
          <SkeletonBox width="60%" height={22} />
          <SkeletonBox width="90%" height={14} />
          <SkeletonBox width="80%" height={14} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="45%" height={18} />
          <SkeletonBox width="60%" height={14} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width="80%" height={14} />
          <SkeletonBox width="70%" height={14} />
          <SkeletonBox width="65%" height={14} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="35%" height={18} />
          <SkeletonBox width="75%" height={14} />
          <SkeletonBox width="70%" height={14} />
        </View>
      </ThemedCard>

      <SkeletonBox width="100%" height={54} borderRadius={16} />
      <View style={styles.buttonRow}>
        <SkeletonBox width="48%" height={50} borderRadius={14} />
        <SkeletonBox width="48%" height={50} borderRadius={14} />
      </View>
    </ScreenContainer>
  );
};

export default PlantDetailsSkeleton;

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  backRow: {
    alignItems: "flex-start",
    paddingHorizontal: 6,
  },
  card: {
    minHeight: "50%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 18,
    gap: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});
