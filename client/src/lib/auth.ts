import { apiRequest } from "./queryClient";
import type { User, InsertUser } from "@shared/schema";

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    console.log("Making login request with:", { username, password: "***" });
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      console.log("Login response status:", response.status);
      const result = await response.json();
      console.log("Login response data:", result);
      return result;
    } catch (error) {
      console.error("Login API error:", error);
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  },

  register: async (userData: InsertUser): Promise<User> => {
    try {
      console.log("Making API request to register with data:", userData);
      const response = await apiRequest("POST", "/api/auth/register", userData);
      console.log("API response status:", response.status);
      const result = await response.json();
      console.log("API response data:", result);
      return result;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem("golf_user");
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem("golf_user", JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem("golf_user");
  },
};
