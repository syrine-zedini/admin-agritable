"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Role = "SuperAdmin" | "AdminCommercial" | "AdminLogistique";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Decode JWT payload without a library
const decodeJwt = (token: string): any => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("admin_user");

    if (token && storedUser) {
      const payload = decodeJwt(token);

      // Check token expiry
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_user");
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(storedUser);
      setUser({
        id: parsed.id,
        email: parsed.email,
        username: parsed.username,
        // ✅ ton generateJwt met "roleName" dans le payload JWT
        role: payload?.roleName ?? parsed.role,
      });
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};