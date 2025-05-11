import { StyleSheet, Text, View, useColorScheme } from "react-native";
import React, { useState } from "react";
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import AppLoading from "expo-app-loading";
const AuthLayout = () => {
  const loadFonts = () =>
    Font.loadAsync({
      "noto-sans": require("../../assets/fonts/MartianMono-VariableFont_wdth,wght.ttf"),
    });
  const [fontsLoaded, setFontsLoaded] = useState(false);
  if (!fontsLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setFontsLoaded(true)}
        onError={console.warn}
      />
    );
  }
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{ headerShown: false, animation: "default" }}
      ></Stack>
    </>
  );
};

export default AuthLayout;

const styles = StyleSheet.create({});
