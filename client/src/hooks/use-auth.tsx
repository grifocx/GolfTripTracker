import { useState, useEffect, createContext, useContext } from "react";
import type { User } from "@shared/schema";
import { authApi } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    authApi.setCurrentUser(userData);
  };

  const logout = () => {
    setUser(null);
    authApi.logout();
  };

  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth called outside of AuthProvider");
    // Return a safe fallback during development/hot reload
    return {
      user: null,
      login: () => {},
      logout: () => {},
      isAdmin: false
    };
  }
  return context;
}
