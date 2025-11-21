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
    // Loading bittikten sonra user yoksa login'e yonlendir
    if (!loading && !user) {
      console.log("User yok, login sayfasina yonlendiriliyor");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Loading durumunda veya user yoksa bos component dondur
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
        {/* 1. Once tum tab'lari gosteren grup */}
        <Stack.Screen name="(tabs)" />

        {/* 2. Sonra detay ekrani */}
        <Stack.Screen name="plant/details" options={{ title: "Detay" }} />
        <Stack.Screen
          name="education/index"
          options={{ title: "Egitimler" }}
        />
        <Stack.Screen
          name="education/module"
          options={{ title: "Egitim Modulu" }}
        />
        <Stack.Screen name="profile/index" options={{ title: "Profil" }} />
      </Stack>
    </ErrorBoundary>
  );
}
