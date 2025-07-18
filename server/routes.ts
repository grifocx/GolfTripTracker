import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertCourseSchema, insertRoundSchema, insertScorecardSchema, insertTournamentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import { achievementService } from "./achievements";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login request body:", req.body);
      const { username, password } = loginSchema.parse(req.body);
      console.log("Parsed login data:", { username, password: "***" });
      
      const user = await storage.getUserByUsername(username);
      console.log("Found user:", user ? { id: user.id, username: user.username } : null);
      
      if (!user) {
        console.log("User not found for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Invalid password for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      console.log("Login successful, returning user:", { id: user.id, username: user.username });
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tournament routes
  app.get("/api/tournament/active", async (req: Request, res: Response) => {
    try {
      const tournament = await storage.getActiveTournament();
      if (!tournament) {
        return res.status(404).json({ message: "No active tournament found" });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tournaments", async (req: Request, res: Response) => {
    try {
      console.log("Tournament POST request received:", req.body);
      const tournamentData = insertTournamentSchema.parse(req.body);
      console.log("Tournament data parsed:", tournamentData);
      
      // Convert numbers to strings for decimal fields in storage
      const storageData = {
        ...tournamentData,
        dailyBuyIn: tournamentData.dailyBuyIn.toString(),
        overallBuyIn: tournamentData.overallBuyIn.toString(),
      };
      console.log("Storage data:", storageData);
      
      const tournament = await storage.createTournament(storageData);
      console.log("Tournament created successfully:", tournament);
      res.json(tournament);
    } catch (error: any) {
      console.error("Tournament creation error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/courses/:id/holes", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const holes = await storage.getHolesByCourse(courseId);
      res.json(holes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/courses/:id/holes", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const { holes } = req.body;
      
      const holeData = holes.map((hole: any) => ({
        ...hole,
        courseId,
      }));
      
      const createdHoles = await storage.createHoles(holeData);
      res.json(createdHoles);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Round routes
  app.get("/api/tournaments/:tournamentId/rounds", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const rounds = await storage.getRoundsByTournament(tournamentId);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rounds", async (req: Request, res: Response) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(roundData);
      res.json(round);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Scorecard routes
  app.get("/api/rounds/:roundId/scorecards", async (req: Request, res: Response) => {
    try {
      const roundId = parseInt(req.params.roundId);
      const scorecards = await storage.getScorecardsByRound(roundId);
      res.json(scorecards);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/scorecards", async (req: Request, res: Response) => {
    try {
      const { scorecard, playerIds } = req.body;
      const scorecardData = insertScorecardSchema.parse(scorecard);
      
      const createdScorecard = await storage.createScorecard(scorecardData);
      await storage.assignPlayersToScorecard(createdScorecard.id, playerIds);
      
      const fullScorecard = await storage.getScorecard(createdScorecard.id);
      res.json(fullScorecard);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Score routes
  app.get("/api/scorecards/:scorecardId/scores", async (req: Request, res: Response) => {
    try {
      const scorecardId = parseInt(req.params.scorecardId);
      const scores = await storage.getScoresByScorecard(scorecardId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/scores", async (req: Request, res: Response) => {
    try {
      const { scores } = req.body;
      const savedScores = await storage.saveScores(scores);
      res.json(savedScores);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leaderboard routes
  app.get("/api/tournaments/:tournamentId/leaderboard", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const leaderboard = await storage.getTournamentLeaderboard(tournamentId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rounds/:roundId/leaderboard", async (req: Request, res: Response) => {
    try {
      const roundId = parseInt(req.params.roundId);
      const leaderboard = await storage.getDailyLeaderboard(roundId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payout routes
  app.get("/api/tournaments/:tournamentId/payouts", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const payouts = await storage.getPayoutsByTournament(tournamentId);
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const userAchievements = await storage.getUserAchievements(userId);
      const stats = await achievementService.getUserAchievementStats(userId);
      res.json({ userAchievements, stats });
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Initialize achievements on server start
  achievementService.initializeAchievements();

  const httpServer = createServer(app);
  return httpServer;
}
