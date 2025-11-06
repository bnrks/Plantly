// app/(dashboard)/_layout.jsx
import { Stack, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../src/context/AuthContext";
import ErrorBoundary from "../../src/components/ErrorBoundary";
import { DashboardErrorFallback } from "../../src/components/ErrorFallbacks";

export default function DashboardLayout() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Loading bittikten sonra user yoksa login'e yönlendir
    if (!loading && !user) {
      console.log("User yok, login sayfasına yönlendiriliyor");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Loading durumunda veya user yoksa boş component döndür
  if (loading || !user) {
    return null;
  }

  return (
    <ErrorBoundary
      fallback={DashboardErrorFallback}
      level="screen"
      name="Dashboard Layout"
      onError={(error, errorInfo) => {
        console.error("Dashboard Layout Error:", error);
        console.error("Error Info:", errorInfo);
      }}
    >
      <Stack screenOptions={{ headerShown: false }}>
        {/* 1. Önce tüm tab'ları gösteren grup */}
        <Stack.Screen name="(tabs)" />

        {/* 2. Sonra detay ekranı */}
        <Stack.Screen name="plant/details" options={{ title: "Detay" }} />
        <Stack.Screen name="education" options={{ title: "Eğitimler" }} />
        <Stack.Screen
          name="education/module"
          options={{ title: "Eğitim Modülü" }}
        />
        <Stack.Screen name="profile" options={{ title: "Profil" }} />
      </Stack>
    </ErrorBoundary>
  );
}
