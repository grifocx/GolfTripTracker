import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, Target, Eye, Feather, CheckCircle, TrendingDown, Medal, 
  CalendarCheck, Flame, TrendingUp, Award, RotateCcw, PlayCircle, Shield,
  Lock, Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Achievement, UserAchievement } from "@shared/schema";

interface AchievementStats {
  totalAchievements: number;
  completedAchievements: number;
  totalPoints: number;
  recentAchievements: any[];
}

interface UserAchievementData {
  userAchievements: (UserAchievement & { achievement: Achievement })[];
  stats: AchievementStats;
}

const tierColors = {
  bronze: "bg-orange-100 text-orange-800 border-orange-300",
  silver: "bg-gray-100 text-gray-800 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  platinum: "bg-purple-100 text-purple-800 border-purple-300"
};

const categoryIcons = {
  scoring: Target,
  tournament: Trophy,
  streak: Flame,
  special: Star
};

const achievementIcons = {
  target: Target,
  eye: Eye,
  feather: Feather,
  "check-circle": CheckCircle,
  "trending-down": TrendingDown,
  trophy: Trophy,
  star: Star,
  medal: Medal,
  "calendar-check": CalendarCheck,
  flame: Flame,
  "trending-up": TrendingUp,
  award: Award,
  "rotate-ccw": RotateCcw,
  "play-circle": PlayCircle,
  shield: Shield
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<(UserAchievement & { achievement: Achievement })[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
    recentAchievements: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchAchievements();
    if (user) {
      fetchUserAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const response = await apiRequest("GET", "/api/achievements");
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest("GET", `/api/achievements/user/${user.id}`);
      const data: UserAchievementData = await response.json();
      setUserAchievements(data.userAchievements);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAchievementCompleted = (achievementId: number) => {
    return userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  };

  const getAchievementProgress = (achievementId: number) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    return userAchievement?.progress || 0;
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return isAchievementCompleted(achievement.id);
    if (activeTab === "locked") return !isAchievementCompleted(achievement.id);
    return achievement.category === activeTab;
  });

  const getProgressPercentage = (achievement: Achievement) => {
    if (!achievement.targetValue) return isAchievementCompleted(achievement.id) ? 100 : 0;
    const progress = getAchievementProgress(achievement.id);
    return Math.min((progress / achievement.targetValue) * 100, 100);
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const completed = isAchievementCompleted(achievement.id);
    const progress = getAchievementProgress(achievement.id);
    const progressPercentage = getProgressPercentage(achievement);
    const IconComponent = achievementIcons[achievement.icon as keyof typeof achievementIcons] || Star;
    
    return (
      <Card className={`relative transition-all duration-200 ${completed ? 'shadow-md border-l-4 border-l-golf-green' : 'opacity-75'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${completed ? 'bg-golf-green/10' : 'bg-gray-100'}`}>
                {completed ? (
                  <IconComponent className="h-6 w-6 text-golf-green" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <CardTitle className={`text-lg ${completed ? 'text-golf-dark' : 'text-gray-600'}`}>
                  {achievement.name}
                </CardTitle>
                <p className={`text-sm ${completed ? 'text-gray-600' : 'text-gray-500'}`}>
                  {achievement.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${tierColors[achievement.tier as keyof typeof tierColors]} text-xs`}>
                {achievement.tier}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Trophy className="h-3 w-3" />
                <span>{achievement.points}pt</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {achievement.targetValue && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}/{achievement.targetValue}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
          {completed && (
            <div className="mt-2 flex items-center gap-2 text-sm text-golf-green">
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
              <Clock className="h-3 w-3 ml-auto" />
              <span className="text-xs text-gray-500">
                {new Date(userAchievements.find(ua => ua.achievementId === achievement.id)?.completedAt || '').toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-golf-dark">Achievements</h1>
          <p className="text-gray-600 mt-2">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-golf-dark">Achievements</h1>
        <p className="text-gray-600 mt-2">Track your golf milestones and earn badges</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-golf-green mx-auto mb-2" />
            <div className="text-2xl font-bold text-golf-dark">{stats.completedAchievements}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-golf-dark">{stats.totalAchievements}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-golf-dark">{stats.totalPoints}</div>
            <div className="text-sm text-gray-600">Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-golf-dark">
              {stats.totalAchievements > 0 ? Math.round((stats.completedAchievements / stats.totalAchievements) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Completion</div>
            <Progress 
              value={stats.totalAchievements > 0 ? (stats.completedAchievements / stats.totalAchievements) * 100 : 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Achievement Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="tournament">Tournament</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
          
          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No achievements found</h3>
              <p className="text-gray-500 mt-2">
                {activeTab === "completed" ? "Complete your first achievement to see it here!" : "Keep playing to unlock achievements!"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}