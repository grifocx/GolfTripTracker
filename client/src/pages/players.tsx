import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Players() {
  const { isAdmin } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournament/active"],
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/tournaments", tournament?.id, "leaderboard"],
    enabled: !!tournament?.id,
  });

  const getPlayerPosition = (userId: number) => {
    const position = leaderboard?.findIndex((p: any) => p.userId === userId) + 1;
    return position > 0 ? position : null;
  };

  const getPlayerStats = (userId: number) => {
    const playerData = leaderboard?.find((p: any) => p.userId === userId);
    return playerData || null;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPositionSuffix = (position: number) => {
    if (position >= 11 && position <= 13) return `${position}th`;
    switch (position % 10) {
      case 1: return `${position}st`;
      case 2: return `${position}nd`;
      case 3: return `${position}rd`;
      default: return `${position}th`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading players...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-2xl font-bold text-golf-dark">Tournament Players</CardTitle>
            {isAdmin && (
              <Button className="bg-golf-green hover:bg-golf-green/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No players registered yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((player: any) => {
                const position = getPlayerPosition(player.id);
                const stats = getPlayerStats(player.id);
                
                return (
                  <Card key={player.id} className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-golf-green rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {getInitials(player.firstName, player.lastName)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-golf-dark">
                            {player.firstName} {player.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{player.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Handicap Index:</span>
                          <div className="font-semibold flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            {player.handicapIndex}
                          </div>
                        </div>
                        {stats && (
                          <div>
                            <span className="text-gray-500">Rounds Played:</span>
                            <div className="font-semibold">{stats.roundsPlayed || 0}</div>
                          </div>
                        )}
                        {position && (
                          <div>
                            <span className="text-gray-500">Current Position:</span>
                            <div className="font-semibold text-golf-green flex items-center">
                              <Trophy className="h-3 w-3 mr-1" />
                              {getPositionSuffix(position)}
                            </div>
                          </div>
                        )}
                        {stats && (
                          <div>
                            <span className="text-gray-500">Net Score:</span>
                            <div className="font-semibold">
                              {stats.netScore > 0 ? `+${stats.netScore}` : stats.netScore}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                        <div className="flex items-center space-x-2">
                          {player.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {position && position <= 3 && (
                            <Badge variant="default" className="text-xs bg-golf-gold">
                              Top 3
                            </Badge>
                          )}
                        </div>
                        {stats && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Total Strokes:</div>
                            <div className="font-semibold">{stats.totalStrokes || 0}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
