import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { asyncHandler, createError, globalErrorHandler } from "./errorHandler";
import { insertUserSchema, loginSchema, insertCourseSchema, insertHoleSchema, insertRoundSchema, insertScorecardSchema, insertTournamentSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { achievementService } from "./achievements";
import { 
  calculateCourseHandicap, 
  getStrokesForHole, 
  validateHoleScore, 
  getScoreValidationMessage 
} from "./golfUtils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", asyncHandler(async (req: Request, res: Response) => {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw createError.conflict("Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword,
    });
  }));

  app.post("/api/auth/login", asyncHandler(async (req: Request, res: Response) => {
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

  // Add global error handler
  app.use(globalErrorHandler);

  // Tournament routes
  app.get("/api/tournaments", async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  app.get("/api/tournaments/:id/players", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const players = await storage.getTournamentPlayers(tournamentId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching tournament players:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tournaments/:id/players", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { playerIds } = req.body;
      
      if (!Array.isArray(playerIds)) {
        return res.status(400).json({ message: "playerIds must be an array" });
      }
      
      await storage.addPlayersToTournament(tournamentId, playerIds);
      res.status(201).json({ message: "Players added successfully" });
    } catch (error) {
      console.error("Error adding players to tournament:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tournaments/:id/rounds", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const rounds = await storage.getRoundsByTournament(tournamentId);
      res.json(rounds);
    } catch (error) {
      console.error("Error fetching tournament rounds:", error);
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

  app.patch("/api/tournaments/:id/status", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["draft", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be draft, in_progress, or completed" });
      }
      
      const tournament = await storage.updateTournamentStatus(tournamentId, status);
      res.json(tournament);
    } catch (error: any) {
      console.error("Tournament status update error:", error);
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

  app.post("/api/users", async (req: Request, res: Response) => {
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

  // Tournament Players routes
  app.get("/api/tournaments/:id/players", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const players = await storage.getTournamentPlayers(tournamentId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tournaments/:id/players", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { playerIds } = req.body;
      
      if (!Array.isArray(playerIds)) {
        return res.status(400).json({ message: "playerIds must be an array" });
      }
      
      const results = await storage.addPlayersToTournament(tournamentId, playerIds);
      res.json(results);
    } catch (error) {
      console.error("Error adding players to tournament:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tournaments/:tournamentId/players/:playerId", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const playerId = parseInt(req.params.playerId);
      
      await storage.removePlayerFromTournament(tournamentId, playerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing player from tournament:", error);
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

  // Get courses with hole counts
  app.get("/api/courses/with-holes", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCoursesWithHoleCounts();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses with holes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create individual hole
  app.post("/api/holes", async (req: Request, res: Response) => {
    try {
      const holeData = insertHoleSchema.parse(req.body);
      const hole = await storage.createHole(holeData);
      res.json(hole);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete hole
  app.delete("/api/holes/:id", async (req: Request, res: Response) => {
    try {
      const holeId = parseInt(req.params.id);
      await storage.deleteHole(holeId);
      res.status(204).send();
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

  app.put("/api/rounds/:id", async (req: Request, res: Response) => {
    try {
      const roundId = parseInt(req.params.id);
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.updateRound(roundId, roundData);
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
      
      // Validate each score against golf rules
      const validationErrors: string[] = [];
      
      for (const score of scores) {
        // Get user, hole, and course data for validation
        const user = await storage.getUser(score.userId);
        const hole = await storage.getHole(score.holeId);
        const course = await storage.getCourse(hole.courseId);
        
        if (!user || !hole || !course) {
          validationErrors.push(`Missing data for score validation`);
          continue;
        }
        
        // Calculate course handicap and strokes received
        const courseHandicap = calculateCourseHandicap(
          parseFloat(user.handicapIndex.toString()),
          course.slopeRating,
          parseFloat(course.courseRating.toString()),
          course.par
        );
        
        const strokesReceived = getStrokesForHole(courseHandicap, hole.handicapRanking);
        
        // Validate the score
        const { isValid } = validateHoleScore(score.strokes, hole, strokesReceived);
        
        if (!isValid) {
          const errorMessage = getScoreValidationMessage(score.strokes, hole, strokesReceived);
          validationErrors.push(`Hole ${hole.holeNumber} for ${user.firstName} ${user.lastName}: ${errorMessage}`);
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Score validation failed", 
          errors: validationErrors 
        });
      }
      
      // Save scores if all validations pass
      const savedScores = await storage.saveScores(scores);
      res.json(savedScores);
    } catch (error) {
      console.error("Score saving error:", error);
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
