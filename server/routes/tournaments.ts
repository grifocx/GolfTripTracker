import type { Express } from "express";
import { storage } from "../storage";
import { insertTournamentSchema } from "@shared/schema";
import { asyncHandler, createError } from "../errorHandler";
import { tournamentValidationSchema } from "../validation";

export function registerTournamentRoutes(app: Express) {
  // Get all tournaments
  app.get("/api/tournaments", asyncHandler(async (req, res) => {
    const tournaments = await storage.getAllTournaments();
    res.json({
      success: true,
      data: tournaments,
    });
  }));

  // Get active tournament
  app.get("/api/tournament/active", asyncHandler(async (req, res) => {
    const tournament = await storage.getActiveTournament();
    if (!tournament) {
      throw createError.notFound("No active tournament found");
    }
    res.json({
      success: true,
      data: tournament,
    });
  }));

  // Create tournament with enhanced validation
  app.post("/api/tournaments", asyncHandler(async (req, res) => {
    const tournamentData = tournamentValidationSchema.parse(req.body);
    
    // Check if course exists
    const course = await storage.getCourse(tournamentData.courseId);
    if (!course) {
      throw createError.badRequest("Selected course does not exist");
    }
    
    // Convert numbers to strings for decimal fields in storage
    const storageData = {
      ...tournamentData,
      dailyBuyIn: tournamentData.dailyBuyIn.toString(),
      overallBuyIn: tournamentData.overallBuyIn.toString(),
    };
    
    const tournament = await storage.createTournament(storageData);
    res.status(201).json({
      success: true,
      data: tournament,
    });
  }));

  // Update tournament status
  app.patch("/api/tournaments/:id/status", asyncHandler(async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!["draft", "in_progress", "completed"].includes(status)) {
      throw createError.badRequest("Invalid status. Must be draft, in_progress, or completed");
    }
    
    // Check if tournament exists
    const existingTournament = await storage.getTournament?.(tournamentId);
    if (!existingTournament) {
      throw createError.notFound("Tournament not found");
    }
    
    const tournament = await storage.updateTournamentStatus(tournamentId, status);
    res.json({
      success: true,
      data: tournament,
    });
  }));

  // Tournament players routes
  app.get("/api/tournaments/:id/players", asyncHandler(async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    const players = await storage.getTournamentPlayers(tournamentId);
    res.json({
      success: true,
      data: players,
    });
  }));

  app.post("/api/tournaments/:id/players", asyncHandler(async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    const { playerIds } = req.body;
    
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw createError.badRequest("playerIds must be a non-empty array");
    }
    
    // Validate all player IDs exist
    for (const playerId of playerIds) {
      const player = await storage.getUser(playerId);
      if (!player) {
        throw createError.badRequest(`Player with ID ${playerId} does not exist`);
      }
    }
    
    await storage.addPlayersToTournament(tournamentId, playerIds);
    res.status(201).json({
      success: true,
      message: "Players added successfully",
    });
  }));
}