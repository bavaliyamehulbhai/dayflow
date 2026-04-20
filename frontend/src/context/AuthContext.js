import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await authAPI.logout();
    } catch (e) {
      // Avoid logging noise for 401s during logout
      if (e.response?.status !== 401) {
        console.error("[AuthContext] logout error:", e);
      }
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data.user);
    } catch (err) {
      // Global interceptor handles 401s via custom event
      if (err.response?.status !== 401) {
        console.error("[AuthContext] fetchUser error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for 401 unauthorized events dispatched by the API interceptor
  useEffect(() => {
    const handler = async () => {
      await logout();
      // Only redirect if not already on /login
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    };
    window.addEventListener("dayflow:unauthorized", handler);
    return () => window.removeEventListener("dayflow:unauthorized", handler);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      console.error("[AuthContext] login error:", err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    setUser(data.user);
    return data;
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
