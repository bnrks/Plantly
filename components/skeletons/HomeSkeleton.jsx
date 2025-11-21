import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import ThemedCard from "../ThemedCard";
import SkeletonBox from "./SkeletonBox";

const skeletonPlants = [0, 1, 2];
const skeletonTrainings = [0, 1, 2];

const HomeSkeleton = () => {
  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.homeContent}
      bottomSpacing={120}
    >
      <Header />

      <ThemedCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryText}>
            <SkeletonBox width="70%" height={18} />
            <SkeletonBox width="55%" height={14} />
          </View>
          <SkeletonBox width={46} height={46} borderRadius={16} />
        </View>
      </ThemedCard>

      <ThemedCard style={styles.listCard}>
        <SkeletonBox width="45%" height={18} style={styles.cardTitle} />
        <SkeletonBox width="70%" height={14} style={styles.cardDescription} />
        <View style={styles.plantList}>
          {skeletonPlants.map((key) => (
            <View style={styles.plantRow} key={`plant-skeleton-${key}`}>
              <SkeletonBox width={72} height={72} borderRadius={16} />
              <View style={styles.plantText}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="50%" height={12} />
              </View>
              <SkeletonBox width={42} height={42} borderRadius={14} />
            </View>
          ))}
        </View>
      </ThemedCard>

      <ThemedCard style={styles.discoveryCard}>
        <View style={styles.discoveryHeader}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width={80} height={14} />
        </View>
        <SkeletonBox
          width="35%"
          height={12}
          style={styles.discoverySubtitle}
        />
        <View style={styles.trainingList}>
          {skeletonTrainings.map((key) => (
            <View style={styles.trainingRow} key={`training-skeleton-${key}`}>
              <View style={styles.trainingText}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="50%" height={12} />
              </View>
              <SkeletonBox width={18} height={18} borderRadius={9} />
            </View>
          ))}
        </View>
      </ThemedCard>
    </ScreenContainer>
  );
};

export default HomeSkeleton;

const styles = StyleSheet.create({
  homeContent: {
    gap: 16,
  },
  summaryCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryText: {
    flex: 1,
    gap: 8,
    paddingRight: 12,
  },
  listCard: {
    borderRadius: 20,
    paddingBottom: 20,
  },
  cardTitle: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  cardDescription: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  plantList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  plantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  plantText: {
    flex: 1,
    gap: 6,
  },
  discoveryCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  discoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  discoverySubtitle: {
    marginBottom: 14,
  },
  trainingList: {
    gap: 10,
  },
  trainingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trainingText: {
    flex: 1,
    gap: 6,
    paddingRight: 12,
  },
});
