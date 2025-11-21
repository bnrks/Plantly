import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import ThemedCard from "../ThemedCard";
import SkeletonBox from "./SkeletonBox";

const placeholderPlants = [0, 1, 2];

const PlantsSkeleton = () => {
  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      bottomSpacing={100}
    >
      <Header />

      <ThemedCard style={styles.card}>
        <SkeletonBox width="40%" height={18} style={styles.cardTitle} />
        <View style={styles.list}>
          {placeholderPlants.map((key) => (
            <View style={styles.row} key={`plant-placeholder-${key}`}>
              <SkeletonBox width={50} height={50} borderRadius={12} />
              <View style={styles.rowText}>
                <SkeletonBox width="70%" height={14} />
                <SkeletonBox width="50%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </ThemedCard>

      <SkeletonBox width="100%" height={54} borderRadius={16} />
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
});
