import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "../types";
import { auth, getToken, setToken, clearToken } from "../api/client";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);

  // ── Validate stored token on startup ──────────────────────
  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    auth
      .me()
      .then((res) => {
        setUser(res.user);
        setTokenState(storedToken);
      })
      .catch(() => {
        // Expired or invalid token — clear and show login
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Listen for 401 events from the API wrapper ────────────
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener("ats:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ats:unauthorized", handleUnauthorized);
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await auth.login(email, password);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  }, []);

  // ── Logout (stateless — just clear local state) ───────────
  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // ── Permission Helper ─────────────────────────────────────
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth — access auth state and actions anywhere in the tree. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
