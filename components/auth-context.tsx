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
  token: string | null;
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
  "permissions",
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = storage?.getItem(STORAGE_KEYS.user);
    const storedAccess = storage?.getItem(STORAGE_KEYS.access);
    const storedToken = storage?.getItem(STORAGE_KEYS.token);

    let parsedUser: User | null = null;
    let parsedAccess: string[] | null = null;

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
      }
    }

    if (storedAccess) {
      try {
        const parsed = JSON.parse(storedAccess);
        if (Array.isArray(parsed)) {
          parsedAccess = parsed;
          setAccess(parsed);
        }
      } catch (error) {
      }
    }

    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    // If the user has "all" access, always expand to the latest ALL_ACCESS list
    const userHasAll = parsedUser?.access?.trim?.().toLowerCase() === "all";

    if (userHasAll) {
      setAccess(ALL_ACCESS);
      storage?.setItem(STORAGE_KEYS.access, JSON.stringify(ALL_ACCESS));
    } else if (parsedAccess && parsedAccess.length) {
      setAccess(parsedAccess);
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
    setToken(null);
    storage?.removeItem(STORAGE_KEYS.user);
    storage?.removeItem(STORAGE_KEYS.access);
    storage?.removeItem(STORAGE_KEYS.token);
    delete axios.defaults.headers.common["Authorization"];
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
      const nextToken: string = result.data.token;
      const nextAccess = parseAccess(nextUser.access);

      persistAuth(nextUser, nextAccess);
      setToken(nextToken);
      storage?.setItem(STORAGE_KEYS.token, nextToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${nextToken}`;
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
      token,
      loading,
      login,
      logout,
    }),
    [access, loading, login, logout, token, user]
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
