// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { observeAuth } from "../services/authService";

export const AuthContext = createContext({ user: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase auth state değiştiğinde user objesini güncelle
    const unsubscribe = observeAuth((u) => setUser(u));
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
