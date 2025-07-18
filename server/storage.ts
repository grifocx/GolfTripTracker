import { 
  users, tournaments, courses, holes, rounds, scorecards, scorecardPlayers, scores, payouts,
  type User, type UpsertUser, type InsertUser, type Tournament, type InsertTournament,
  type Course, type InsertCourse, type Hole, type InsertHole,
  type Round, type InsertRound, type Scorecard, type InsertScorecard,
  type ScorecardPlayer, type Score, type InsertScore, type Payout
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Legacy user methods (for backward compatibility)
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tournament methods
  getActiveTournament(): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, tournament: Partial<InsertTournament>): Promise<Tournament>;

  // Course methods
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCourseWithHoles(id: number): Promise<(Course & { holes: Hole[] }) | undefined>;

  // Hole methods
  getHolesByCourse(courseId: number): Promise<Hole[]>;
  createHole(hole: InsertHole): Promise<Hole>;
  createHoles(holes: InsertHole[]): Promise<Hole[]>;

  // Round methods
  getRoundsByTournament(tournamentId: number): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRoundStatus(id: number, status: string): Promise<Round>;

  // Scorecard methods
  getScorecardsByRound(roundId: number): Promise<(Scorecard & { players: User[] })[]>;
  getScorecard(id: number): Promise<(Scorecard & { players: User[] }) | undefined>;
  createScorecard(scorecard: InsertScorecard): Promise<Scorecard>;
  assignPlayersToScorecard(scorecardId: number, userIds: number[]): Promise<void>;

  // Score methods
  getScoresByScorecard(scorecardId: number): Promise<(Score & { user: User; hole: Hole })[]>;
  saveScore(score: InsertScore): Promise<Score>;
  saveScores(scores: InsertScore[]): Promise<Score[]>;

  // Leaderboard methods
  getTournamentLeaderboard(tournamentId: number): Promise<any[]>;
  getDailyLeaderboard(roundId: number): Promise<any[]>;

  // Payout methods
  getPayoutsByTournament(tournamentId: number): Promise<(Payout & { user: User })[]>;
  savePayout(payout: Omit<Payout, 'id' | 'createdAt'>): Promise<Payout>;
}

export class DatabaseStorage implements IStorage {
  // Replit Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Legacy methods for backward compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async getActiveTournament(): Promise<Tournament | undefined> {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.isActive, true))
      .orderBy(desc(tournaments.createdAt));
    return tournament || undefined;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [newTournament] = await db
      .insert(tournaments)
      .values(tournament)
      .returning();
    return newTournament;
  }

  async updateTournament(id: number, tournament: Partial<InsertTournament>): Promise<Tournament> {
    const [updated] = await db
      .update(tournaments)
      .set(tournament)
      .where(eq(tournaments.id, id))
      .returning();
    return updated;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(asc(courses.name));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async getCourseWithHoles(id: number): Promise<(Course & { holes: Hole[] }) | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const courseHoles = await this.getHolesByCourse(id);
    return { ...course, holes: courseHoles };
  }

  async getHolesByCourse(courseId: number): Promise<Hole[]> {
    return await db
      .select()
      .from(holes)
      .where(eq(holes.courseId, courseId))
      .orderBy(asc(holes.holeNumber));
  }

  async createHole(hole: InsertHole): Promise<Hole> {
    const [newHole] = await db
      .insert(holes)
      .values(hole)
      .returning();
    return newHole;
  }

  async createHoles(holeData: InsertHole[]): Promise<Hole[]> {
    return await db
      .insert(holes)
      .values(holeData)
      .returning();
  }

  async getRoundsByTournament(tournamentId: number): Promise<Round[]> {
    return await db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournamentId))
      .orderBy(asc(rounds.roundNumber));
  }

  async getRound(id: number): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round || undefined;
  }

  async createRound(round: InsertRound): Promise<Round> {
    const [newRound] = await db
      .insert(rounds)
      .values(round)
      .returning();
    return newRound;
  }

  async updateRoundStatus(id: number, status: string): Promise<Round> {
    const [updated] = await db
      .update(rounds)
      .set({ status })
      .where(eq(rounds.id, id))
      .returning();
    return updated;
  }

  async getScorecardsByRound(roundId: number): Promise<(Scorecard & { players: User[] })[]> {
    const roundScorecards = await db
      .select()
      .from(scorecards)
      .where(eq(scorecards.roundId, roundId))
      .orderBy(asc(scorecards.name));

    const result = [];
    for (const scorecard of roundScorecards) {
      const players = await db
        .select({ user: users })
        .from(scorecardPlayers)
        .innerJoin(users, eq(scorecardPlayers.userId, users.id))
        .where(eq(scorecardPlayers.scorecardId, scorecard.id));

      result.push({
        ...scorecard,
        players: players.map(p => p.user),
      });
    }

    return result;
  }

  async getScorecard(id: number): Promise<(Scorecard & { players: User[] }) | undefined> {
    const [scorecard] = await db.select().from(scorecards).where(eq(scorecards.id, id));
    if (!scorecard) return undefined;

    const players = await db
      .select({ user: users })
      .from(scorecardPlayers)
      .innerJoin(users, eq(scorecardPlayers.userId, users.id))
      .where(eq(scorecardPlayers.scorecardId, id));

    return {
      ...scorecard,
      players: players.map(p => p.user),
    };
  }

  async createScorecard(scorecard: InsertScorecard): Promise<Scorecard> {
    const [newScorecard] = await db
      .insert(scorecards)
      .values(scorecard)
      .returning();
    return newScorecard;
  }

  async assignPlayersToScorecard(scorecardId: number, userIds: number[]): Promise<void> {
    const assignments = userIds.map(userId => ({
      scorecardId,
      userId,
    }));

    await db.insert(scorecardPlayers).values(assignments);
  }

  async getScoresByScorecard(scorecardId: number): Promise<(Score & { user: User; hole: Hole })[]> {
    return await db
      .select({
        id: scores.id,
        scorecardId: scores.scorecardId,
        userId: scores.userId,
        holeId: scores.holeId,
        strokes: scores.strokes,
        createdAt: scores.createdAt,
        user: users,
        hole: holes,
      })
      .from(scores)
      .innerJoin(users, eq(scores.userId, users.id))
      .innerJoin(holes, eq(scores.holeId, holes.id))
      .where(eq(scores.scorecardId, scorecardId))
      .orderBy(asc(holes.holeNumber));
  }

  async saveScore(score: InsertScore): Promise<Score> {
    const [newScore] = await db
      .insert(scores)
      .values(score)
      .onConflictDoUpdate({
        target: [scores.scorecardId, scores.userId, scores.holeId],
        set: { strokes: score.strokes },
      })
      .returning();
    return newScore;
  }

  async saveScores(scoreData: InsertScore[]): Promise<Score[]> {
    const savedScores = [];
    for (const score of scoreData) {
      savedScores.push(await this.saveScore(score));
    }
    return savedScores;
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<any[]> {
    // Get the lowest handicap in the tournament
    const lowestHandicapResult = await db
      .select({ minHandicap: sql<number>`min(${users.handicap})` })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .innerJoin(rounds, eq(scorecards.roundId, rounds.id))
      .where(eq(rounds.tournamentId, tournamentId));

    const lowestHandicap = lowestHandicapResult[0]?.minHandicap || 0;

    // Calculate leaderboard with net scores
    const leaderboard = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        handicap: users.handicap,
        totalStrokes: sql<number>`sum(${scores.strokes})`,
        roundsPlayed: sql<number>`count(distinct ${rounds.id})`,
      })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .innerJoin(rounds, eq(scorecards.roundId, rounds.id))
      .innerJoin(scores, and(eq(scores.userId, users.id), eq(scores.scorecardId, scorecards.id)))
      .where(eq(rounds.tournamentId, tournamentId))
      .groupBy(users.id, users.firstName, users.lastName, users.handicap)
      .orderBy(sql`sum(${scores.strokes}) + (${users.handicap} - ${lowestHandicap})`);

    // Add calculated fields
    return leaderboard.map((player, index) => ({
      ...player,
      netScore: (player.totalStrokes || 0) + (player.handicap - lowestHandicap),
      position: index + 1,
      name: `${player.firstName} ${player.lastName}`,
    }));
  }

  async getDailyLeaderboard(roundId: number): Promise<any[]> {
    // Get the lowest handicap for the round
    const lowestHandicapResult = await db
      .select({ minHandicap: sql<number>`min(${users.handicap})` })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .where(eq(scorecards.roundId, roundId));

    const lowestHandicap = lowestHandicapResult[0]?.minHandicap || 0;

    // Calculate daily leaderboard
    const leaderboard = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        handicap: users.handicap,
        totalStrokes: sql<number>`sum(${scores.strokes})`,
      })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .innerJoin(scores, and(eq(scores.userId, users.id), eq(scores.scorecardId, scorecards.id)))
      .where(eq(scorecards.roundId, roundId))
      .groupBy(users.id, users.firstName, users.lastName, users.handicap)
      .orderBy(sql`sum(${scores.strokes}) + (${users.handicap} - ${lowestHandicap})`);

    return leaderboard.map((player, index) => ({
      ...player,
      netScore: (player.totalStrokes || 0) + (player.handicap - lowestHandicap),
      position: index + 1,
      name: `${player.firstName} ${player.lastName}`,
    }));
  }

  async getPayoutsByTournament(tournamentId: number): Promise<(Payout & { user: User })[]> {
    return await db
      .select({
        id: payouts.id,
        tournamentId: payouts.tournamentId,
        userId: payouts.userId,
        roundId: payouts.roundId,
        amount: payouts.amount,
        type: payouts.type,
        position: payouts.position,
        createdAt: payouts.createdAt,
        user: users,
      })
      .from(payouts)
      .innerJoin(users, eq(payouts.userId, users.id))
      .where(eq(payouts.tournamentId, tournamentId))
      .orderBy(asc(payouts.position));
  }

  async savePayout(payout: Omit<Payout, 'id' | 'createdAt'>): Promise<Payout> {
    const [newPayout] = await db
      .insert(payouts)
      .values(payout)
      .returning();
    return newPayout;
  }
}

export const storage = new DatabaseStorage();
