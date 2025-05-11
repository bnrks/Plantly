import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Spacer = ({ width = "100%", height = "100%" }) => {
  return <View style={{ width: width, height: height }}></View>;
};

export default Spacer;

const styles = StyleSheet.create({});
