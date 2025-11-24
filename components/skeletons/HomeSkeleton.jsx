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
        <View style={styles.plantListHorizontal}>
          {skeletonPlants.map((key) => (
            <View style={styles.plantCard} key={`plant-skeleton-${key}`}>
              <SkeletonBox width="100%" height={110} />
              <View style={styles.plantInfo}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="50%" height={12} />
                <SkeletonBox width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </ThemedCard>

      <ThemedCard style={styles.discoveryCard}>
        <View style={styles.discoveryHeader}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width={80} height={14} />
        </View>
        <FlatListLikeRow data={skeletonTrainings} />
      </ThemedCard>
    </ScreenContainer>
  );
};

export default HomeSkeleton;

const FlatListLikeRow = ({ data }) => {
  return (
    <View style={styles.educationList}>
      {data.map((key) => (
        <View style={styles.educationCard} key={`edu-skeleton-${key}`}>
          <SkeletonBox width="100%" height={110} />
          <View style={styles.educationInfo}>
            <SkeletonBox width="70%" height={16} />
            <SkeletonBox width="90%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

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
    marginBottom: 10,
  },
  plantListHorizontal: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  plantCard: {
    width: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  plantInfo: {
    padding: 10,
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
  educationList: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
  educationCard: {
    width: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  educationInfo: {
    padding: 10,
    gap: 6,
  },
});
