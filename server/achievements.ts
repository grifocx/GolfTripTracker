import { storage } from "./storage";
import type { Achievement, InsertAchievement, User, Tournament, Round, Score } from "@shared/schema";

export class AchievementService {
  // Default achievements that will be created when the service starts
  private defaultAchievements: InsertAchievement[] = [
    // Scoring achievements
    {
      name: "Hole in One",
      description: "Score a hole-in-one",
      icon: "target",
      category: "scoring",
      condition: "hole_in_one",
      tier: "platinum",
      points: 100,
      isActive: true
    },
    {
      name: "Eagle Eye",
      description: "Score an eagle",
      icon: "eye",
      category: "scoring", 
      condition: "eagle",
      tier: "gold",
      points: 50,
      isActive: true
    },
    {
      name: "Birdie Hunter",
      description: "Score 5 birdies in a single round",
      icon: "feather",
      category: "scoring",
      condition: "birdies_in_round",
      targetValue: 5,
      tier: "silver",
      points: 25,
      isActive: true
    },
    {
      name: "Par for the Course",
      description: "Complete a round at par or better",
      icon: "check-circle",
      category: "scoring",
      condition: "round_par_or_better",
      tier: "bronze",
      points: 15,
      isActive: true
    },
    {
      name: "Under Par",
      description: "Finish a tournament under par",
      icon: "trending-down",
      category: "scoring",
      condition: "tournament_under_par",
      tier: "silver",
      points: 30,
      isActive: true
    },
    
    // Tournament achievements
    {
      name: "Tournament Champion",
      description: "Win a tournament",
      icon: "trophy",
      category: "tournament",
      condition: "tournament_win",
      tier: "gold",
      points: 75,
      isActive: true
    },
    {
      name: "Daily Winner",
      description: "Win a daily round",
      icon: "star",
      category: "tournament",
      condition: "daily_win",
      tier: "silver",
      points: 25,
      isActive: true
    },
    {
      name: "Top 3 Finish",
      description: "Finish in the top 3 of a tournament",
      icon: "medal",
      category: "tournament",
      condition: "top_3_finish",
      tier: "bronze",
      points: 20,
      isActive: true
    },
    {
      name: "Consistent Player",
      description: "Participate in 3 tournaments",
      icon: "calendar-check",
      category: "tournament",
      condition: "tournament_participation",
      targetValue: 3,
      tier: "bronze",
      points: 10,
      isActive: true
    },
    
    // Streak achievements
    {
      name: "Hot Streak",
      description: "Win 3 daily rounds in a row",
      icon: "flame",
      category: "streak",
      condition: "daily_win_streak",
      targetValue: 3,
      tier: "gold",
      points: 50,
      isActive: true
    },
    {
      name: "Steady Eddie",
      description: "Score par or better on 5 consecutive holes",
      icon: "trending-up",
      category: "streak",
      condition: "consecutive_par_or_better",
      targetValue: 5,
      tier: "silver",
      points: 20,
      isActive: true
    },
    
    // Special achievements
    {
      name: "Course Record",
      description: "Set the lowest score on a course",
      icon: "award",
      category: "special",
      condition: "course_record",
      tier: "platinum",
      points: 100,
      isActive: true
    },
    {
      name: "Comeback Kid",
      description: "Win a tournament after being in last place",
      icon: "rotate-ccw",
      category: "special",
      condition: "comeback_win",
      tier: "gold",
      points: 60,
      isActive: true
    },
    {
      name: "First Timer",
      description: "Complete your first tournament",
      icon: "play-circle",
      category: "special",
      condition: "first_tournament",
      tier: "bronze",
      points: 15,
      isActive: true
    },
    {
      name: "Veteran Player",
      description: "Play in 10 tournaments",
      icon: "shield",
      category: "special",
      condition: "veteran_tournaments",
      targetValue: 10,
      tier: "gold",
      points: 40,
      isActive: true
    }
  ];

  async initializeAchievements(): Promise<void> {
    try {
      const existingAchievements = await storage.getAllAchievements();
      
      if (existingAchievements.length === 0) {
        console.log("Creating default achievements...");
        for (const achievement of this.defaultAchievements) {
          await storage.createAchievement(achievement);
        }
        console.log(`Created ${this.defaultAchievements.length} default achievements`);
      }
    } catch (error) {
      console.error("Error initializing achievements:", error);
    }
  }

  async checkScoreAchievements(userId: number, score: Score, context: { tournament?: Tournament; round?: Round }): Promise<void> {
    // Check for hole-in-one
    if (score.strokes === 1) {
      await this.awardAchievement(userId, "hole_in_one", context);
    }
    
    // Check for eagle (2 under par)
    // Note: This would require hole par information, which needs to be passed in
    // For now, we'll implement the basic structure
    
    // Additional score-based achievements would be checked here
  }

  async checkTournamentAchievements(userId: number, tournament: Tournament, finalPosition: number): Promise<void> {
    // Check for tournament win
    if (finalPosition === 1) {
      await this.awardAchievement(userId, "tournament_win", { tournament });
    }
    
    // Check for top 3 finish
    if (finalPosition <= 3) {
      await this.awardAchievement(userId, "top_3_finish", { tournament });
    }
    
    // Check for first tournament completion
    await this.awardAchievement(userId, "first_tournament", { tournament });
  }

  async checkDailyAchievements(userId: number, round: Round, dailyPosition: number): Promise<void> {
    // Check for daily win
    if (dailyPosition === 1) {
      await this.awardAchievement(userId, "daily_win", { round });
    }
  }

  private async awardAchievement(userId: number, condition: string, context: { tournament?: Tournament; round?: Round }): Promise<void> {
    try {
      const achievements = await storage.getAllAchievements();
      const achievement = achievements.find(a => a.condition === condition);
      
      if (!achievement) {
        return;
      }

      // Check if user already has this achievement
      const userAchievements = await storage.getUserAchievements(userId);
      const existingAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      
      if (existingAchievement?.isCompleted) {
        return; // Already completed
      }

      // Award the achievement
      await storage.completeUserAchievement(
        userId, 
        achievement.id, 
        context.tournament?.id, 
        context.round?.id
      );

      console.log(`Achievement awarded: ${achievement.name} to user ${userId}`);
    } catch (error) {
      console.error("Error awarding achievement:", error);
    }
  }

  async getUserAchievementStats(userId: number): Promise<{
    totalAchievements: number;
    completedAchievements: number;
    totalPoints: number;
    recentAchievements: any[];
  }> {
    try {
      const allAchievements = await storage.getAllAchievements();
      const userAchievements = await storage.getUserAchievements(userId);
      
      const completedAchievements = userAchievements.filter(ua => ua.isCompleted);
      const totalPoints = completedAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
      
      // Get recent achievements (last 5)
      const recentAchievements = userAchievements
        .filter(ua => ua.isCompleted)
        .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
        .slice(0, 5);

      return {
        totalAchievements: allAchievements.length,
        completedAchievements: completedAchievements.length,
        totalPoints,
        recentAchievements
      };
    } catch (error) {
      console.error("Error getting user achievement stats:", error);
      return {
        totalAchievements: 0,
        completedAchievements: 0,
        totalPoints: 0,
        recentAchievements: []
      };
    }
  }
}

export const achievementService = new AchievementService();