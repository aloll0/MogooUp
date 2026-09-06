import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken, setRefreshToken, getRefreshToken, getAccessToken } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isVerified: boolean;
  isApproved?: boolean;
  isSystemAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("mogoo_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const setUser: React.Dispatch<React.SetStateAction<User | null>> = (updater) => {
    setUserState((prev) => {
      const nextUser = typeof updater === "function" ? updater(prev) : updater;
      if (nextUser) {
        localStorage.setItem("mogoo_user", JSON.stringify(nextUser));
      } else {
        localStorage.removeItem("mogoo_user");
      }
      return nextUser;
    });
  };

  // Initialize session by checking token or refreshing silently on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = getAccessToken();
      const storedRefreshToken = getRefreshToken();

      // If no token exists at all in storage or cookies, user is guest
      if (!storedAccessToken && !storedRefreshToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }

      try {
        // Retrieve current profile details with access token
        const meResponse = await api.get("/auth/me");
        const currentUser = meResponse.data.data.user;
        setUser(currentUser);
      } catch (error) {
        // Access token may be expired, attempt refresh
        try {
          const refreshResponse = await api.post(
            "/auth/refresh",
            { refreshToken: storedRefreshToken },
            {
              headers: storedRefreshToken ? { "x-refresh-token": storedRefreshToken } : undefined,
            }
          );
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
          setAccessToken(accessToken);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }

          const meResponse = await api.get("/auth/me");
          const currentUser = meResponse.data.data.user;
          setUser(currentUser);
        } catch (refreshError) {
          // Token is definitively invalid/revoked
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: loggedInUser, accessToken, refreshToken } = response.data.data;
      queryClient.clear();
      setAccessToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      setUser(loggedInUser);
    } catch (error) {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, fullName: string, password: string) => {
    await api.post("/auth/register", { email, fullName, password });
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      queryClient.clear();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
