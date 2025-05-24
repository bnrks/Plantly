// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { observeAuth } from "../services/authService";
import { auth } from "../services/firebaseConfig";
export const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Firebase auth state değiştiğinde çağrılır
    const unsubscribe = observeAuth((u) => {
      setUser(u);
      setLoading(false); // ilk kayıt geldiğinde loading’i kapat
    });
    return unsubscribe;
  }, []);
  const logout = async () => {
    try {
      await auth.signOut(); // Firebase oturumu kapat
      // setUser(null);           // onAuthStateChanged zaten user’ı null’a çeker
    } catch (e) {
      console.error("Çıkış hatası:", e);
    }
  };
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
