// src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { observeAuth } from "../services/authService";
import { auth } from "../services/firebaseConfig";

export const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı durumunu AsyncStorage'a kaydetme
  const saveUserToStorage = async (userData) => {
    try {
      if (userData) {
        const userToSave = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
        };
        await AsyncStorage.setItem("user", JSON.stringify(userToSave));
        console.log(
          "✅ Kullanıcı durumu AsyncStorage'a kaydedildi:",
          userToSave.email
        );
      } else {
        await AsyncStorage.removeItem("user");
        console.log("❌ Kullanıcı durumu AsyncStorage'dan silindi");
      }
    } catch (error) {
      console.error("Kullanıcı durumu kaydedilirken hata:", error);
    }
  };

  // Uygulama açıldığında kayıtlı kullanıcı durumunu yükleme
  const loadUserFromStorage = async () => {
    try {
      console.log("🔄 AsyncStorage'dan kullanıcı yükleniyor...");
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log("✅ Kayıtlı kullanıcı yüklendi:", userData.email);
        return userData;
      } else {
        console.log("❌ AsyncStorage'da kayıtlı kullanıcı bulunamadı");
        return null;
      }
    } catch (error) {
      console.error("Kullanıcı durumu yüklenirken hata:", error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // İlk olarak kayıtlı kullanıcıyı yükle
        const cachedUser = await loadUserFromStorage();

        // Firebase auth state değiştiğinde çağrılır
        const unsubscribe = observeAuth((firebaseUser) => {
          if (!isMounted) return;

          console.log(
            "🔥 Firebase auth state değişti:",
            firebaseUser?.email || "null"
          );

          if (firebaseUser) {
            // Firebase'den güncel kullanıcı geldi
            setUser(firebaseUser);
            saveUserToStorage(firebaseUser);
          } else {
            // Firebase'de kullanıcı yok
            if (cachedUser) {
              // Ama cache'de var, muhtemelen offline
              console.log("📱 Offline mod: Cache'deki kullanıcı korunuyor");
              // Cache'deki kullanıcıyı kullan
              setUser(cachedUser);
            } else {
              // Ne Firebase'de ne cache'de kullanıcı var
              setUser(null);
              saveUserToStorage(null);
            }
          }

          setLoading(false);
        });

        // Cache'de kullanıcı varsa ama Firebase auth henüz tetiklenmemişse
        if (cachedUser && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 3000); // 3 saniye timeout
        } else if (!cachedUser && isMounted) {
          // Cache'de kullanıcı yok, Firebase response bekleniyor
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 5000); // 5 saniye timeout
        }

        return unsubscribe;
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          setLoading(false);
        }
        return () => {};
      }
    };

    initializeAuth().then((unsubscribe) => {
      if (!isMounted) return;

      return () => {
        isMounted = false;
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      };
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      console.log("🚪 Kullanıcı çıkış yapıyor...");
      await auth.signOut(); // Firebase oturumu kapat
      await AsyncStorage.removeItem("user"); // Kayıtlı kullanıcı durumunu sil
      setUser(null); // State'i temizle
      console.log("✅ Kullanıcı çıkış yaptı ve veriler temizlendi");
    } catch (e) {
      console.error("🔥 Çıkış hatası:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
