"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, getAuthData, setAuthData, clearAuthData, getCurrentUser } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const { token, user: storedUser } = getAuthData();
    if (token && storedUser) {
      setUser(storedUser);
      // Verify token is still valid
      getCurrentUser()
        .then(({ user }) => {
          setUser(user);
          setAuthData(token, user);
        })
        .catch(() => {
          clearAuthData();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { login: loginApi } = await import("@/lib/auth");
    const response = await loginApi(email, password);
    setAuthData(response.token, response.user);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { register: registerApi } = await import("@/lib/auth");
    const response = await registerApi(email, password, name);
    setAuthData(response.token, response.user);
    setUser(response.user);
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user } = await getCurrentUser();
      setUser(user);
      const { token } = getAuthData();
      if (token) {
        setAuthData(token, user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

