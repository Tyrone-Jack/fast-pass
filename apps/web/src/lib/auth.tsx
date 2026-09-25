import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, type CurrentDriver } from "./api";

type AuthState = {
  driver: CurrentDriver | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<CurrentDriver | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setDriver(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDriver(null);
      } else {
        setDriver(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.auth.login(email, password);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api.auth.logout();
    setDriver(null);
  }, []);

  return (
    <AuthContext.Provider value={{ driver, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
