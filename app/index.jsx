import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Link } from "expo-router";

const index = () => {
  return (
    <View>
      <Text>index</Text>
      <Link
        href={"/home"}
        style={{
          fontSize: 20,
          padding: 20,
          backgroundColor: "blue",
          color: "white",
          borderRadius: 10,
        }}
      >
        Home
      </Link>
      <Link
        href={"/login"}
        style={{
          fontSize: 20,
          padding: 20,
          backgroundColor: "blue",
          color: "white",
          borderRadius: 10,
        }}
      >
        login
      </Link>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({});
