import type { Express } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { asyncHandler, createError } from "../errorHandler";

export function registerAuthRoutes(app: Express) {
  // User registration
  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw createError.conflict("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await storage.getUserByEmail?.(userData.email);
    if (existingEmail) {
      throw createError.conflict("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  }));

  // User login
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      throw createError.unauthorized("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw createError.unauthorized("Invalid credentials");
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword,
    });
  }));

  // Get current user (if implementing sessions)
  app.get("/api/auth/me", asyncHandler(async (req, res) => {
    // This would require session middleware
    res.json({
      success: true,
      data: null, // Implement when adding session support
    });
  }));
}