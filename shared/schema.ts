import { pgTable, text, serial, integer, boolean, timestamp, decimal, date } from "drizzle-orm/pg-core";
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
  handicap: integer("handicap").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  dailyBuyIn: decimal("daily_buy_in", { precision: 10, scale: 2 }).notNull(),
  overallBuyIn: decimal("overall_buy_in", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  par: integer("par").notNull(),
  yardage: integer("yardage").notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scorecardPlayers: many(scorecardPlayers),
  scores: many(scores),
  payouts: many(payouts),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  rounds: many(rounds),
  payouts: many(payouts),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  holes: many(holes),
  rounds: many(rounds),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
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
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Payout = typeof payouts.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
