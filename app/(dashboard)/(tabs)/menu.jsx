import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function MenuScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(dashboard)/(tabs)/home");
  }, [router]);

  return null;
}
