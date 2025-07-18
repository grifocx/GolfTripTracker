import { apiRequest } from "./queryClient";
import type { User, LoginData, InsertUser } from "@shared/schema";

export const authApi = {
  login: async (credentials: LoginData): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (userData: InsertUser): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
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
