import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

// NOTE: JWT is stored in localStorage for this hackathon demo. In production this
// should move to httpOnly + Secure + SameSite=Strict cookies to eliminate XSS
// token theft. Kept as localStorage here to keep the preview CORS setup simple
// (Bearer header, no cross-site cookie negotiation).
const AuthContext = createContext();
const KEY = "sg_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
  });

  useEffect(() => {
    if (auth?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
    localStorage.setItem(KEY, JSON.stringify(auth || null));
  }, [auth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data);
    return data.user;
  };

  const logout = () => setAuth(null);

  return (
    <AuthContext.Provider value={{ user: auth?.user || null, token: auth?.token || null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
