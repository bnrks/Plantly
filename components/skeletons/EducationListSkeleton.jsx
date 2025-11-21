import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import ScreenContainer from "../ScreenContainer";
import SkeletonBox from "./SkeletonBox";

const { width } = Dimensions.get("window");
const cardWidth = width - 32;
const placeholderCards = [0, 1, 2];

const EducationListSkeleton = () => {
  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <SkeletonBox width={38} height={38} borderRadius={12} />
        </View>

        <View style={styles.hero}>
          <SkeletonBox width={56} height={56} borderRadius={28} />
          <SkeletonBox width="70%" height={24} />
          <SkeletonBox width="90%" height={14} />
          <SkeletonBox width="80%" height={14} />
        </View>

        <View style={styles.list}>
          {placeholderCards.map((key) => (
            <View
              key={`education-card-${key}`}
              style={[styles.card, { width: cardWidth }]}
            >
              <SkeletonBox width="100%" height={160} />
              <View style={styles.cardText}>
                <SkeletonBox width="60%" height={18} />
                <SkeletonBox width="90%" height={14} />
                <SkeletonBox width="80%" height={14} />
              </View>
              <View style={styles.tagRow}>
                <SkeletonBox width={80} height={18} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};

export default EducationListSkeleton;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  hero: {
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  list: {
    alignItems: "center",
    gap: 18,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    paddingBottom: 16,
  },
  cardText: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 8,
  },
  tagRow: {
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingTop: 10,
  },
});
