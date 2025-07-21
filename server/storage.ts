import { 
  users, tournaments, tournamentPlayers, courses, holes, rounds, scorecards, scorecardPlayers, scores, payouts,
  achievements, userAchievements,
  type User, type InsertUser, type Tournament, type InsertTournament,
  type Course, type InsertCourse, type Hole, type InsertHole,
  type Round, type InsertRound, type Scorecard, type InsertScorecard,
  type ScorecardPlayer, type TournamentPlayer, type Score, type InsertScore, type Payout,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { 
  calculateCourseHandicap, 
  getStrokesForHole, 
  calculateNetStrokes,
  calculateLeaderboardPositions,
  formatScoreToPar
} from "./golfUtils";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tournament methods
  getActiveTournament(): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, tournament: Partial<InsertTournament>): Promise<Tournament>;
  updateTournamentStatus(id: number, status: "draft" | "in_progress" | "completed"): Promise<Tournament>;
  addPlayersToTournament(tournamentId: number, playerIds: number[]): Promise<void>;
  getTournamentPlayers(tournamentId: number): Promise<User[]>;

  // Course methods
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCourseWithHoles(id: number): Promise<(Course & { holes: Hole[] }) | undefined>;

  // Hole methods
  getHolesByCourse(courseId: number): Promise<Hole[]>;
  createHole(hole: InsertHole): Promise<Hole>;
  createHoles(holes: InsertHole[]): Promise<Hole[]>;
  deleteHole(holeId: number): Promise<void>;
  getCoursesWithHoleCounts(): Promise<(Course & { holes: Hole[]; holesCount: number })[]>;

  // Round methods
  getRoundsByTournament(tournamentId: number): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: number, round: Partial<InsertRound>): Promise<Round>;
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

  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateUserAchievement(userId: number, achievementId: number, progress: number): Promise<void>;
  completeUserAchievement(userId: number, achievementId: number, tournamentId?: number, roundId?: number): Promise<void>;
  checkAndUpdateAchievements(userId: number, context: { tournament?: Tournament; round?: Round; score?: Score }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

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
    // Look for in-progress tournament first, then draft tournaments
    const [inProgressTournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.status, "in_progress"), eq(tournaments.isActive, true)))
      .orderBy(desc(tournaments.createdAt));
    
    if (inProgressTournament) {
      return inProgressTournament;
    }
    
    // If no in-progress tournament, return the latest draft
    const [draftTournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.status, "draft"), eq(tournaments.isActive, true)))
      .orderBy(desc(tournaments.createdAt));
    
    return draftTournament || undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  }

  async addPlayersToTournament(tournamentId: number, playerIds: number[]): Promise<void> {
    const values = playerIds.map(playerId => ({
      tournamentId,
      userId: playerId,
    }));
    await db.insert(tournamentPlayers).values(values);
  }

  async getTournamentPlayers(tournamentId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        handicapIndex: users.handicapIndex,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(tournamentPlayers)
      .innerJoin(users, eq(tournamentPlayers.userId, users.id))
      .where(eq(tournamentPlayers.tournamentId, tournamentId));
    
    return result;
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

  async updateTournamentStatus(id: number, status: "draft" | "in_progress" | "completed"): Promise<Tournament> {
    const [updated] = await db
      .update(tournaments)
      .set({ status })
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

  async getHole(holeId: number): Promise<Hole | undefined> {
    const [hole] = await db.select().from(holes).where(eq(holes.id, holeId));
    return hole;
  }

  async createHoles(holeData: InsertHole[]): Promise<Hole[]> {
    return await db
      .insert(holes)
      .values(holeData)
      .returning();
  }

  async deleteHole(holeId: number): Promise<void> {
    await db
      .delete(holes)
      .where(eq(holes.id, holeId));
  }

  async getCoursesWithHoleCounts(): Promise<(Course & { holes: Hole[]; holesCount: number })[]> {
    const allCourses = await this.getAllCourses();
    const result = [];
    
    for (const course of allCourses) {
      const courseHoles = await this.getHolesByCourse(course.id);
      result.push({
        ...course,
        holes: courseHoles,
        holesCount: courseHoles.length,
      });
    }
    
    return result;
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

  async updateRound(id: number, round: Partial<InsertRound>): Promise<Round> {
    const [updated] = await db
      .update(rounds)
      .set(round)
      .where(eq(rounds.id, id))
      .returning();
    return updated;
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
    // Calculate net strokes using proper golf handicap system
    const netStrokes = await this.calculateNetStrokesForScore(score);
    
    const [newScore] = await db
      .insert(scores)
      .values({
        ...score,
        netStrokes
      })
      .onConflictDoUpdate({
        target: [scores.scorecardId, scores.userId, scores.holeId],
        set: { 
          strokes: score.strokes,
          netStrokes: netStrokes
        },
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

  private async calculateNetStrokesForScore(score: InsertScore): Promise<number> {
    // Get user, hole, and course data
    const [user] = await db.select().from(users).where(eq(users.id, score.userId));
    const [hole] = await db.select().from(holes).where(eq(holes.id, score.holeId));
    const [course] = await db.select().from(courses).where(eq(courses.id, hole.courseId));
    
    if (!user || !hole || !course) {
      throw new Error("Unable to calculate net strokes: missing user, hole, or course data");
    }

    // Calculate course handicap
    const courseHandicap = calculateCourseHandicap(
      parseFloat(user.handicapIndex.toString()),
      course.slopeRating,
      parseFloat(course.courseRating.toString()),
      course.par
    );

    // Calculate strokes received on this hole
    const strokesReceived = getStrokesForHole(courseHandicap, hole.handicapRanking);

    // Calculate net strokes
    return calculateNetStrokes(score.strokes, strokesReceived);
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<any[]> {
    // Optimized leaderboard query with proper joins and aggregation
    const leaderboard = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        handicapIndex: users.handicapIndex,
        totalStrokes: sql<number>`COALESCE(sum(${scores.strokes}), 0)`,
        totalNetStrokes: sql<number>`COALESCE(sum(${scores.netStrokes}), 0)`,
        roundsPlayed: sql<number>`count(distinct ${rounds.id})`,
        holesCompleted: sql<number>`count(${scores.id})`,
      })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .innerJoin(rounds, eq(scorecards.roundId, rounds.id))
      .leftJoin(scores, and(eq(scores.userId, users.id), eq(scores.scorecardId, scorecards.id)))
      .where(eq(rounds.tournamentId, tournamentId))
      .groupBy(users.id, users.firstName, users.lastName, users.handicapIndex)
      .having(sql`count(${scores.id}) > 0`) // Only include players with scores
      .orderBy(sql`COALESCE(sum(${scores.netStrokes}), 999999)`); // Handle nulls properly

    // Add calculated fields and positions with tie handling
    let currentPosition = 1;
    let previousScore = null;
    
    return leaderboard.map((player, index) => {
      // Handle ties properly
      if (previousScore !== null && player.totalNetStrokes !== previousScore) {
        currentPosition = index + 1;
      }
      previousScore = player.totalNetStrokes;
      
      return {
      ...player,
      netScore: player.totalNetStrokes || 0,
      position: currentPosition,
      name: `${player.firstName} ${player.lastName}`,
      scoringAverage: player.holesCompleted > 0 ? 
        Math.round((player.totalNetStrokes / player.holesCompleted) * 100) / 100 : 0,
    };
    });
  }

  async getDailyLeaderboard(roundId: number): Promise<any[]> {
    // Calculate daily leaderboard using proper net scores
    const leaderboard = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        handicapIndex: users.handicapIndex,
        totalStrokes: sql<number>`sum(${scores.strokes})`,
        totalNetStrokes: sql<number>`sum(${scores.netStrokes})`,
      })
      .from(users)
      .innerJoin(scorecardPlayers, eq(users.id, scorecardPlayers.userId))
      .innerJoin(scorecards, eq(scorecardPlayers.scorecardId, scorecards.id))
      .innerJoin(scores, and(eq(scores.userId, users.id), eq(scores.scorecardId, scorecards.id)))
      .where(eq(scorecards.roundId, roundId))
      .groupBy(users.id, users.firstName, users.lastName, users.handicapIndex)
      .orderBy(sql`sum(${scores.netStrokes})`);

    return leaderboard.map((player, index) => ({
      ...player,
      netScore: player.totalNetStrokes || 0,
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

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [result] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return result;
  }

  async updateUserAchievement(userId: number, achievementId: number, progress: number): Promise<void> {
    await db
      .update(userAchievements)
      .set({ progress })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
  }

  async completeUserAchievement(userId: number, achievementId: number, tournamentId?: number, roundId?: number): Promise<void> {
    await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
        progress: 1,
        isCompleted: true,
        completedAt: new Date(),
        tournamentId,
        roundId
      })
      .onConflictDoUpdate({
        target: [userAchievements.userId, userAchievements.achievementId],
        set: {
          isCompleted: true,
          completedAt: new Date(),
          progress: 1
        }
      });
  }

  async checkAndUpdateAchievements(userId: number, context: { tournament?: Tournament; round?: Round; score?: Score }): Promise<void> {
    // This will be implemented in the achievement service
    // For now, just a placeholder that will be expanded
    console.log(`Checking achievements for user ${userId}`);
  }

  // Tournament Player Management
  async getTournamentPlayers(tournamentId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        handicapIndex: users.handicapIndex,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(tournamentPlayers)
      .innerJoin(users, eq(tournamentPlayers.userId, users.id))
      .where(eq(tournamentPlayers.tournamentId, tournamentId))
      .orderBy(users.firstName, users.lastName);
    
    return result;
  }

  async addPlayersToTournament(tournamentId: number, playerIds: number[]): Promise<any[]> {
    const tournamentPlayerData = playerIds.map(playerId => ({
      tournamentId,
      userId: playerId,
    }));

    const results = await db
      .insert(tournamentPlayers)
      .values(tournamentPlayerData)
      .onConflictDoNothing()
      .returning();
    
    return results;
  }

  async removePlayerFromTournament(tournamentId: number, playerId: number): Promise<void> {
    await db
      .delete(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournamentId, tournamentId),
          eq(tournamentPlayers.userId, playerId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
