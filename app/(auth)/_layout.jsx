// app/(auth)/_layout.jsx
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Slot } from "expo-router";

export default function AuthLayout() {
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          "noto-sans": require("../../assets/fonts/MartianMono-VariableFont_wdth,wght.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!ready) {
    return null; // splash ekranı açık kalır
  }

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
