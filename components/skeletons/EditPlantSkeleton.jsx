import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import Header from "../Header";
import ThemedCard from "../ThemedCard";
import SkeletonBox from "./SkeletonBox";

const EditPlantSkeleton = () => {
  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      bottomSpacing={120}
    >
      <Header style={{ marginTop: 40, marginBottom: -5 }} />

      <ThemedCard style={styles.card}>
        <SkeletonBox height={200} borderRadius={16} />

        <View style={styles.section}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width="100%" height={50} borderRadius={12} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width="100%" height={50} borderRadius={12} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width="100%" height={120} borderRadius={12} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="55%" height={18} />
          <SkeletonBox width="80%" height={14} />
          <SkeletonBox width="100%" height={50} borderRadius={12} />
          <View style={styles.noteList}>
            <SkeletonBox width="100%" height={46} borderRadius={10} />
            <SkeletonBox width="94%" height={46} borderRadius={10} />
            <SkeletonBox width="88%" height={46} borderRadius={10} />
          </View>
        </View>
      </ThemedCard>

      <SkeletonBox width="100%" height={50} borderRadius={14} />
      <SkeletonBox width="100%" height={50} borderRadius={14} />
    </ScreenContainer>
  );
};

export default EditPlantSkeleton;

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  noteList: {
    gap: 8,
  },
});
