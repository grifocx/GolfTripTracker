import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  handicapIndex: decimal("handicap_index", { precision: 4, scale: 1 }).notNull(), // Official handicap index
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  dailyBuyIn: decimal("daily_buy_in", { precision: 10, scale: 2 }).notNull(),
  overallBuyIn: decimal("overall_buy_in", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, completed
  isActive: boolean("is_active").default(true).notNull(), // Keep for backward compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentPlayers = pgTable("tournament_players", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  par: integer("par").notNull(),
  yardage: integer("yardage").notNull(),
  courseRating: decimal("course_rating", { precision: 4, scale: 1 }).notNull(), // e.g., 72.5
  slopeRating: integer("slope_rating").notNull().default(113), // Standard slope is 113
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const holes = pgTable("holes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  holeNumber: integer("hole_number").notNull(),
  par: integer("par").notNull(),
  yardage: integer("yardage").notNull(),
  handicapRanking: integer("handicap_ranking").notNull(), // 1-18, 1 = most difficult
});

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scorecards = pgTable("scorecards", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").references(() => rounds.id).notNull(),
  name: text("name").notNull(), // A, B, C, D
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scorecardPlayers = pgTable("scorecard_players", {
  id: serial("id").primaryKey(),
  scorecardId: integer("scorecard_id").references(() => scorecards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  scorecardId: integer("scorecard_id").references(() => scorecards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  holeId: integer("hole_id").references(() => holes.id).notNull(),
  strokes: integer("strokes").notNull(),
  netStrokes: integer("net_strokes").notNull(), // Gross strokes minus handicap strokes for this hole
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roundId: integer("round_id").references(() => rounds.id), // null for overall tournament payout
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // daily, overall
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  category: text("category").notNull(), // scoring, tournament, streak, special
  condition: text("condition").notNull(), // hole_in_one, eagles, tournament_wins, etc.
  targetValue: integer("target_value"), // null for one-time achievements
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum
  points: integer("points").notNull().default(10),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  progress: integer("progress").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  tournamentId: integer("tournament_id").references(() => tournaments.id), // optional context
  roundId: integer("round_id").references(() => rounds.id), // optional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scorecardPlayers: many(scorecardPlayers),
  scores: many(scores),
  payouts: many(payouts),
  userAchievements: many(userAchievements),
  tournamentPlayers: many(tournamentPlayers),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  course: one(courses, {
    fields: [tournaments.courseId],
    references: [courses.id],
  }),
  rounds: many(rounds),
  payouts: many(payouts),
  tournamentPlayers: many(tournamentPlayers),
}));

export const tournamentPlayersRelations = relations(tournamentPlayers, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPlayers.tournamentId],
    references: [tournaments.id],
  }),
  user: one(users, {
    fields: [tournamentPlayers.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  holes: many(holes),
  rounds: many(rounds),
  tournaments: many(tournaments),
}));

export const holesRelations = relations(holes, ({ one, many }) => ({
  course: one(courses, {
    fields: [holes.courseId],
    references: [courses.id],
  }),
  scores: many(scores),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [rounds.tournamentId],
    references: [tournaments.id],
  }),
  course: one(courses, {
    fields: [rounds.courseId],
    references: [courses.id],
  }),
  scorecards: many(scorecards),
}));

export const scorecardsRelations = relations(scorecards, ({ one, many }) => ({
  round: one(rounds, {
    fields: [scorecards.roundId],
    references: [rounds.id],
  }),
  scorecardPlayers: many(scorecardPlayers),
  scores: many(scores),
}));

export const scorecardPlayersRelations = relations(scorecardPlayers, ({ one }) => ({
  scorecard: one(scorecards, {
    fields: [scorecardPlayers.scorecardId],
    references: [scorecards.id],
  }),
  user: one(users, {
    fields: [scorecardPlayers.userId],
    references: [users.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  scorecard: one(scorecards, {
    fields: [scores.scorecardId],
    references: [scorecards.id],
  }),
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
  hole: one(holes, {
    fields: [scores.holeId],
    references: [holes.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [payouts.tournamentId],
    references: [tournaments.id],
  }),
  user: one(users, {
    fields: [payouts.userId],
    references: [users.id],
  }),
  round: one(rounds, {
    fields: [payouts.roundId],
    references: [rounds.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
  tournament: one(tournaments, {
    fields: [userAchievements.tournamentId],
    references: [tournaments.id],
  }),
  round: one(rounds, {
    fields: [userAchievements.roundId],
    references: [rounds.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
});

export const insertTournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  courseId: z.number().min(1, "Course is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  dailyBuyIn: z.number().min(0, "Daily buy-in must be positive"),
  overallBuyIn: z.number().min(0, "Overall buy-in must be positive"),
  status: z.enum(["draft", "in_progress", "completed"]).optional().default("draft"),
  isActive: z.boolean().optional().default(true),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertHoleSchema = createInsertSchema(holes).omit({
  id: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  createdAt: true,
});

export const insertScorecardSchema = createInsertSchema(scorecards).omit({
  id: true,
  createdAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
  netStrokes: true, // netStrokes calculated automatically
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Hole = typeof holes.$inferSelect;
export type InsertHole = z.infer<typeof insertHoleSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Scorecard = typeof scorecards.$inferSelect;
export type InsertScorecard = z.infer<typeof insertScorecardSchema>;
export type ScorecardPlayer = typeof scorecardPlayers.$inferSelect;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Payout = typeof payouts.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type LoginData = z.infer<typeof loginSchema>;
