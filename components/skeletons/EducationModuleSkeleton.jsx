import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenContainer from "../ScreenContainer";
import SkeletonBox from "./SkeletonBox";

const EducationModuleSkeleton = () => {
  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <SkeletonBox width={38} height={38} borderRadius={12} />
      </View>

      <SkeletonBox height={80} borderRadius={16} style={styles.header} />

      <View style={styles.hero}>
        <SkeletonBox width={56} height={56} borderRadius={20} />
        <SkeletonBox width="70%" height={20} />
        <SkeletonBox width="90%" height={14} />
        <SkeletonBox width="80%" height={14} />
      </View>

      <View style={styles.card}>
        <SkeletonBox width="50%" height={18} />
        <SkeletonBox width="100%" height={14} />
        <SkeletonBox width="95%" height={14} />
        <SkeletonBox width="90%" height={14} />
        <SkeletonBox width="60%" height={14} />

        <SkeletonBox
          width="50%"
          height={46}
          borderRadius={12}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
};

export default EducationModuleSkeleton;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  header: {
    marginBottom: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  button: {
    marginTop: 14,
  },
});
