import { createContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@plantly_theme";

export const ThemeContext = createContext({
  theme: "light",
  themeMode: "system", // "light", "dark", "system"
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("system"); // "light", "dark", "system"
  const [isLoading, setIsLoading] = useState(true);

  // Başlangıçta kayıtlı tema tercihini yükle
  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
        setThemeModeState(storedTheme);
      }
    } catch (error) {
      console.error("Tema yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tema modunu değiştir ve kaydet
  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Tema kaydedilirken hata:", error);
    }
  };

  // Gerçek tema değeri (system modunda sistem temasını kullan)
  const theme = themeMode === "system" 
    ? (systemColorScheme || "light") 
    : themeMode;

  // Geriye uyumluluk için toggleTheme (light/dark arasında geçiş)
  const toggleTheme = () => {
    const newMode = theme === "light" ? "dark" : "light";
    setThemeMode(newMode);
  };

  // Yükleme tamamlanana kadar bekle
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
