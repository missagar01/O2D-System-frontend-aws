"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { AUTH_BASE_URL, axiosConfig } from "@/config/api";

type User = {
  id: number;
  username: string;
  access?: string;
  supervisor_name?: string;
  item_name?: string;
  quality_controller?: string;
  role?: string;
  loading_incharge?: string;
  created_at?: string;
  updated_at?: string;
};

type AuthContextValue = {
  user: User | null;
  access: string[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<string[]>;
  logout: () => Promise<void>;
};

const ALL_ACCESS = [
  "dashboard",
  "orders",
  "gate-entry",
  "first-weight",
  "load-vehicle",
  "second-weight",
  "generate-invoice",
  "gate-out",
  "payment",
  "complaint-details",
  "party-feedback",
  "register",
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  token: "o2d_token",
  user: "o2d_user",
  access: "o2d_access",
};

const storage = typeof window !== "undefined" ? window.sessionStorage : null;

const parseAccess = (raw?: string | null) => {
  if (!raw) return [];

  const normalized = raw.trim().toLowerCase();
  if (normalized === "all") return ALL_ACCESS;

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = storage?.getItem(STORAGE_KEYS.user);
    const storedAccess = storage?.getItem(STORAGE_KEYS.access);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
      }
    }

    if (storedAccess) {
      try {
        const parsedAccess = JSON.parse(storedAccess);
        if (Array.isArray(parsedAccess)) {
          setAccess(parsedAccess);
        }
      } catch (error) {
      }
    }

    setLoading(false);
  }, []);

  const persistAuth = useCallback(
    (nextUser: User, nextAccess: string[]) => {
      setUser(nextUser);
      setAccess(nextAccess);

      storage?.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      storage?.setItem(STORAGE_KEYS.access, JSON.stringify(nextAccess));
    },
    []
  );

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccess([]);
    storage?.removeItem(STORAGE_KEYS.user);
    storage?.removeItem(STORAGE_KEYS.access);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${AUTH_BASE_URL}/auth/login`,
        { username, password },
        { ...axiosConfig }
      );

      const result = res.data;
      if (!result?.success || !result?.data?.user || !result?.data?.token) {
        throw new Error(result?.error || "Invalid response from server");
      }

      const nextUser: User = result.data.user;
      const nextAccess = parseAccess(nextUser.access);

      persistAuth(nextUser, nextAccess);
      return nextAccess;
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${AUTH_BASE_URL}/auth/logout`, undefined, { ...axiosConfig });
    } catch (error) {
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      access,
      isAuthenticated: Boolean(user && access.length),
      loading,
      login,
      logout,
    }),
    [access, loading, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
