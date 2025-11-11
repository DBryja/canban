"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, getAuthData, setAuthData, clearAuthData, getCurrentUser } from "@/lib/auth";

interface UserWithProjects extends User {
  isAdmin?: boolean;
  projectMembers?: Array<{
    id: string;
    role: string;
    project: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

interface AuthContextType {
  user: User | null;
  fullUser: UserWithProjects | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [fullUser, setFullUser] = useState<UserWithProjects | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const { token, user: storedUser } = getAuthData();
    if (token && storedUser) {
      // Set user immediately from storage for instant UI
      setUser(storedUser);
      setLoading(false);
      
      // Verify token is still valid in background and get full user data
      getCurrentUser()
        .then(({ user: fullUserData }) => {
          setUser(fullUserData);
          setFullUser(fullUserData);
          setAuthData(token, fullUserData);
        })
        .catch((error) => {
          // Only clear if token is actually invalid (401 or 403)
          if (error.response?.status === 401 || error.response?.status === 403) {
            clearAuthData();
            setUser(null);
            setFullUser(null);
          }
          // For other errors (network, etc), keep the user logged in
        });
    } else if (token && !storedUser) {
      // We have token but no user data, try to fetch
      setLoading(true);
      getCurrentUser()
        .then(({ user: fullUserData }) => {
          setUser(fullUserData);
          setFullUser(fullUserData);
          setAuthData(token, fullUserData);
        })
        .catch(() => {
          clearAuthData();
          setUser(null);
          setFullUser(null);
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
    // Fetch full user data
    try {
      const { user: fullUserData } = await getCurrentUser();
      setFullUser(fullUserData);
    } catch {
      // Ignore errors, user is still logged in
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const { register: registerApi } = await import("@/lib/auth");
    const response = await registerApi(email, password, name);
    setAuthData(response.token, response.user);
    setUser(response.user);
    // Fetch full user data
    try {
      const { user: fullUserData } = await getCurrentUser();
      setFullUser(fullUserData);
    } catch {
      // Ignore errors, user is still logged in
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    setFullUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user: fullUserData } = await getCurrentUser();
      setUser(fullUserData);
      setFullUser(fullUserData);
      const { token } = getAuthData();
      if (token) {
        setAuthData(token, fullUserData);
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // Only logout if token is actually invalid (401/403)
      // Don't logout on network errors or other issues
      if (status === 401 || status === 403) {
        console.error("Token invalid, logging out:", error);
        logout();
      } else {
        // For other errors, just log but don't logout
        console.error("Failed to refresh user (non-auth error):", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, fullUser, loading, login, register, logout, refreshUser }}>
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

