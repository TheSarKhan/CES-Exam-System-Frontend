"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "./api";
import type { JwtResponse } from "./types";

interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => void;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setTokenCookie(token: string) {
  document.cookie = `ces_token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

function clearTokenCookie() {
  document.cookie = "ces_token=; path=/; max-age=0";
}

function loadUserFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ces_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(loadUserFromStorage());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<JwtResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("ces_token", data.token);
    const authUser: AuthUser = {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: data.roles,
    };
    localStorage.setItem("ces_user", JSON.stringify(authUser));
    setTokenCookie(data.token);
    setUser(authUser);

    if (data.roles.includes("ROLE_ADMIN")) {
      router.push("/dashboard");
    } else {
      router.push("/employee/dashboard");
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* token may already be invalid */
    }
    localStorage.removeItem("ces_token");
    localStorage.removeItem("ces_user");
    clearTokenCookie();
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateProfile = useCallback((firstName: string, lastName: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, firstName, lastName };
      localStorage.setItem("ces_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const isAdmin = useCallback(() => user?.roles.includes("ROLE_ADMIN") ?? false, [user]);
  const isEmployee = useCallback(
    () =>
      user?.roles.some((r) => r === "ROLE_EMPLOYEE" || r === "ROLE_CANDIDATE") ?? false,
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
