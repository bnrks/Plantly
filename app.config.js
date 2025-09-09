import "dotenv/config";

export default {
  expo: {
    scheme: "plantly",
    name: "Plantly",
    slug: "Plantly",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/plantly-logo.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.bnrks.Plantly",
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],
    extra: {
      router: {},
      eas: {
        projectId:
          process.env.EXPO_PROJECT_ID || "49ba9225-cd41-4e90-9343-711093409f10",
      },
      firebase: {
        apiKey:
          process.env.FIREBASE_API_KEY ||
          "AIzaSyBC4KJsYshPdihaFZNvieGZ_jCOLtNNsck",
        authDomain:
          process.env.FIREBASE_AUTH_DOMAIN || "plantly-fae5e.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "plantly-fae5e",
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          "plantly-fae5e.firebasestorage.app",
        messagingSenderId:
          process.env.FIREBASE_MESSAGING_SENDER_ID || "250730263332",
        appId:
          process.env.FIREBASE_APP_ID ||
          "1:250730263332:web:8951fd8ef2863b380539b1",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-SGE1ETE4HF",
      },
    },
    owner: "bnrks",
  },
};
