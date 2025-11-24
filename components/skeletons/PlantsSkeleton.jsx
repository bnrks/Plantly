import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import ThemedCard from "../ThemedCard";
import SkeletonBox from "./SkeletonBox";

const placeholderPlants = [0, 1, 2, 3];

const PlantsSkeleton = () => {
  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      bottomSpacing={100}
    >
      <Header />

      <ThemedCard style={styles.card}>
        <SkeletonBox width="45%" height={20} style={styles.cardTitle} />
        <View style={styles.grid}>
          {placeholderPlants.map((key) => (
            <View style={styles.plantCard} key={`plant-placeholder-${key}`}>
              <SkeletonBox width="100%" height={110} />
              <View style={styles.info}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="60%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </ThemedCard>

      <SkeletonBox width="100%" height={58} borderRadius={20} />
    </ScreenContainer>
  );
};

export default PlantsSkeleton;

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  card: {
    width: "100%",
    borderRadius: 20,
  },
  cardTitle: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  plantCard: {
    width: "48%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  info: {
    padding: 10,
    gap: 6,
  },
});
