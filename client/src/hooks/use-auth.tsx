import { useState, useEffect, createContext, useContext } from "react";
import type { PublicUser } from "@shared/schema";
import { authApi } from "@/lib/auth";

interface AuthContextType {
  user: PublicUser | null;
  login: (user: PublicUser) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    // For demo deployment, use mock admin user
    if (window.location.hostname.includes('netlify.app')) {
      setUser({
        id: 1,
        username: "demo_admin",
        firstName: "Demo",
        lastName: "Admin",
        email: "admin@demo.com",
        handicapIndex: "0.0",
        isAdmin: true,
        createdAt: new Date()
      });
    } else {
      const currentUser = authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  }, []);

  const login = (userData: PublicUser) => {
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
