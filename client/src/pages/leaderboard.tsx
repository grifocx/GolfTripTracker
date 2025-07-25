import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trophy, Calendar, DollarSign, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<"overall" | "daily">("overall");
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = useQuery({
    queryKey: ["/api/tournament/active"],
  });

  const { data: rounds, isLoading: roundsLoading, error: roundsError } = useQuery({
    queryKey: ["/api/tournaments", tournament?.id, "rounds"],
    enabled: !!tournament?.id,
  });

  const { data: overallLeaderboard, isLoading: overallLoading, error: overallError } = useQuery({
    queryKey: ["/api/tournaments", tournament?.id, "leaderboard"],
    enabled: !!tournament?.id && leaderboardType === "overall",
  });



  // Auto-select the current round or latest round
  const currentRound = rounds?.find((r: any) => r.status === "in_progress") || rounds?.[rounds.length - 1];
  const displayRound = selectedRoundId ? rounds?.find((r: any) => r.id === selectedRoundId) : currentRound;

  const { data: dailyLeaderboard, isLoading: dailyLoading } = useQuery({
    queryKey: ["/api/rounds", displayRound?.id, "leaderboard"],
    enabled: !!displayRound?.id && leaderboardType === "daily",
  });

  const isLoading = leaderboardType === "overall" ? overallLoading : dailyLoading;
  const leaderboard = leaderboardType === "overall" ? overallLeaderboard : dailyLeaderboard;

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return position;
    }
  };

  const getScoreColor = (netScore: number) => {
    if (netScore < 0) return "text-golf-green";
    if (netScore > 0) return "text-red-600";
    return "text-gray-900";
  };

  const formatScore = (score: number) => {
    if (score === 0) return "E";
    return score > 0 ? `+${score}` : `${score}`;
  };

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              No active tournament found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-golf-dark">{tournament.name}</h2>
              <p className="text-gray-600 mt-1">
                {currentRound ? `${currentRound.course?.name} • Round ${currentRound.roundNumber}` : "Tournament"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-golf-green/10 px-4 py-2 rounded-lg text-center">
                <div className="text-lg font-bold text-golf-green">
                  ${(parseFloat(tournament.overallBuyIn) * (leaderboard?.length || 0)).toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Total Pot</div>
              </div>
              <div className="bg-golf-gold/10 px-4 py-2 rounded-lg text-center">
                <div className="text-lg font-bold golf-gold">
                  ${(parseFloat(tournament.dailyBuyIn) * (leaderboard?.length || 0)).toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Daily Pot</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Toggle */}
      <Card>
        <CardContent className="p-1">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={leaderboardType === "overall" ? "default" : "ghost"}
              onClick={() => setLeaderboardType("overall")}
              className={cn(
                "h-12",
                leaderboardType === "overall" && "bg-golf-green hover:bg-golf-green/90"
              )}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Overall Tournament
            </Button>
            <Button
              variant={leaderboardType === "daily" ? "default" : "ghost"}
              onClick={() => setLeaderboardType("daily")}
              className={cn(
                "h-12",
                leaderboardType === "daily" && "bg-golf-green hover:bg-golf-green/90"
              )}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Daily Round
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Round Selector for Daily View */}
      {leaderboardType === "daily" && rounds && rounds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-semibold text-gray-700">Select Round:</Label>
              <Select
                value={selectedRoundId?.toString() || displayRound?.id?.toString() || ""}
                onValueChange={(value) => setSelectedRoundId(parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round: any) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      Round {round.roundNumber} - {round.date}
                      {round.status === 'in_progress' && ' (Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {leaderboardType === "overall" ? (
                <Trophy className="h-5 w-5 text-golf-green" />
              ) : (
                <Calendar className="h-5 w-5 text-golf-green" />
              )}
              <span>
                {leaderboardType === "overall" ? "Overall Tournament Leaderboard" : 
                 displayRound ? `Round ${displayRound.roundNumber} Leaderboard` : "Round Leaderboard"}
              </span>
            </div>
            {leaderboardType === "daily" && displayRound && (
              <div className="text-sm text-gray-600">
                {displayRound.date} • {displayRound.courseName || 'Course TBD'}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading leaderboard...</div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scores available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HCP
                    </th>
                    {leaderboardType === "overall" && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rounds
                      </th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((player: any, index: number) => (
                    <tr key={player.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                            index === 0 ? "bg-golf-gold" : 
                            index === 1 ? "bg-gray-400" :
                            index === 2 ? "bg-amber-600" : "bg-gray-300"
                          )}>
                            <span className={index > 2 ? "text-gray-600" : ""}>
                              {getRankIcon(index + 1)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-golf-green rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {player.firstName?.[0]}{player.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {player.name || `${player.firstName} ${player.lastName}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {player.handicapIndex}
                      </td>
                      {leaderboardType === "overall" && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {player.roundsPlayed}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("text-lg font-bold", getScoreColor(player.netScore))}>
                          {formatScore(player.netScore)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
