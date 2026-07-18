import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken } from "../services/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session by refreshing the access token silently on load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const refreshResponse = await api.post("/auth/refresh");
        const { accessToken } = refreshResponse.data.data;
        setAccessToken(accessToken);

        // Retrieve current profile details
        const meResponse = await api.get("/auth/me");
        setUser(meResponse.data.data.user);
      } catch (error) {
        // Fail silently: user is not logged in
        setAccessToken(null);
        setUser(null);
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
      const { user: loggedInUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(loggedInUser);
    } catch (error) {
      setAccessToken(null);
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
      setUser(null);
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
