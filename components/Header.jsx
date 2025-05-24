import { StyleSheet, View, Image } from "react-native";
import React from "react";

// props olarak style parametresi ekleyin
const Header = ({ style, imageStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        style={[styles.image, imageStyle]}
        source={require("../assets/header.png")}
      />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
