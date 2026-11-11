"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types";
import { api, getToken, setToken, removeToken } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.auth.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
      removeToken();
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    const savedToken = getToken();
    if (savedToken) {
      setTokenState(savedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
    try {
      await refreshUser();
    } catch {
      //
    }
    window.location.href = "/";
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
