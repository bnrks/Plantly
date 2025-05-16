// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { observeAuth } from "../services/authService";

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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
