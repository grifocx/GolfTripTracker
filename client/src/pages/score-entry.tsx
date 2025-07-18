import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, CheckCircle, Info, Calendar } from "lucide-react";

export default function ScoreEntry() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournament/active"],
  });

  const { data: rounds } = useQuery({
    queryKey: ["/api/tournaments", tournament?.id, "rounds"],
    enabled: !!tournament?.id,
  });

  const { data: scorecards } = useQuery({
    queryKey: ["/api/rounds", selectedRoundId, "scorecards"],
    enabled: !!selectedRoundId,
  });

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", rounds?.find((r: any) => r.id === selectedRoundId)?.courseId, "holes"],
    enabled: !!selectedRoundId && !!rounds,
  });

  const { data: existingScores } = useQuery({
    queryKey: ["/api/scorecards", selectedScorecardId, "scores"],
    enabled: !!selectedScorecardId,
  });

  const saveScoresMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      return apiRequest("POST", "/api/scores", { scores: scoreData });
    },
    onSuccess: () => {
      toast({
        title: "Scores Saved",
        description: "All scores have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scorecards", selectedScorecardId, "scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save scores",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
              <p>Only administrators can enter scores.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedScorecard = scorecards?.find((sc: any) => sc.id === selectedScorecardId);
  const selectedRound = rounds?.find((r: any) => r.id === selectedRoundId);

  const handleScoreChange = (userId: number, holeId: number, strokes: number) => {
    const key = `${userId}-${holeId}`;
    setScores(prev => ({ ...prev, [key]: strokes }));
  };

  const getScore = (userId: number, holeId: number) => {
    const key = `${userId}-${holeId}`;
    const existingScore = existingScores?.find((s: any) => s.userId === userId && s.holeId === holeId);
    return scores[key] ?? existingScore?.strokes ?? "";
  };

  const calculateTotal = (userId: number, holes: any[]) => {
    return holes.reduce((total, hole) => {
      const score = getScore(userId, hole.id);
      return total + (typeof score === 'number' ? score : 0);
    }, 0);
  };

  const handleSaveScores = () => {
    if (!selectedScorecardId || !holes) return;

    const scoreData = Object.entries(scores).map(([key, strokes]) => {
      const [userId, holeId] = key.split('-').map(Number);
      return {
        scorecardId: selectedScorecardId,
        userId,
        holeId,
        strokes,
      };
    });

    saveScoresMutation.mutate(scoreData);
  };

  return (
    <div className="space-y-6">
      {/* Tournament Context Header */}
      {tournament && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-golf-dark">{tournament.name}</h1>
                <p className="text-gray-600">
                  {tournament.startDate} - {tournament.endDate} | {tournament.location}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Score Entry</div>
                <div className="text-xs text-gray-400">Admin Access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-golf-dark">Select Round & Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Round Selection with Better Context */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Tournament Round</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rounds?.map((round: any) => (
                <div
                  key={round.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRoundId === round.id
                      ? "border-golf-green bg-golf-green/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setSelectedRoundId(round.id);
                    setSelectedScorecardId(null);
                    setScores({});
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-golf-dark">Round {round.roundNumber}</h3>
                    {selectedRoundId === round.id ? (
                      <CheckCircle className="h-5 w-5 text-golf-green" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {round.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      Course: {round.courseName || 'Not specified'}
                    </div>
                    <div className="text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        round.status === 'completed' ? 'bg-green-100 text-green-800' :
                        round.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {round.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Selection with Better Context */}
          {selectedRoundId && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Playing Group</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scorecards?.map((scorecard: any) => (
                  <div
                    key={scorecard.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedScorecardId === scorecard.id
                        ? "border-golf-green bg-golf-green/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedScorecardId(scorecard.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-golf-dark">Group {scorecard.name}</h3>
                      {selectedScorecardId === scorecard.id ? (
                        <CheckCircle className="h-5 w-5 text-golf-green" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 mb-2">Players in this group:</div>
                      {scorecard.players?.map((player: any) => (
                        <div key={player.id} className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-golf-green rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {player.firstName[0]}{player.lastName[0]}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {player.firstName} {player.lastName}
                            <span className="text-gray-500 ml-2">HCP: {player.handicapIndex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Entry Grid */}
          {selectedScorecardId && selectedScorecard && holes && (
            <div className="space-y-4">
              {/* Context Breadcrumb */}
              <div className="bg-golf-green/5 border border-golf-green/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-semibold text-golf-dark">Now Entering:</span>
                  <span className="text-gray-600">{tournament?.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600">
                    Round {rounds?.find((r: any) => r.id === selectedRoundId)?.roundNumber} 
                    ({rounds?.find((r: any) => r.id === selectedRoundId)?.date})
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600">Group {selectedScorecard.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600">
                    Course: {rounds?.find((r: any) => r.id === selectedRoundId)?.courseName || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Player
                      </th>
                      {holes.slice(0, 9).map((hole: any) => (
                        <th key={hole.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <div>H{hole.holeNumber}</div>
                          <div className="text-xs text-gray-400">Par {hole.par}</div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Out
                      </th>
                      {holes.slice(9, 18).map((hole: any) => (
                        <th key={hole.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <div>H{hole.holeNumber}</div>
                          <div className="text-xs text-gray-400">Par {hole.par}</div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        In
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedScorecard.players?.map((player: any) => {
                      const frontNine = holes.slice(0, 9);
                      const backNine = holes.slice(9, 18);
                      const frontTotal = calculateTotal(player.id, frontNine);
                      const backTotal = calculateTotal(player.id, backNine);
                      const totalScore = frontTotal + backTotal;

                      return (
                        <tr key={player.id}>
                          <td className="px-3 py-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-golf-green rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {player.firstName[0]}{player.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{player.firstName} {player.lastName}</div>
                                <div className="text-xs text-gray-500">HCP: {player.handicapIndex}</div>
                              </div>
                            </div>
                          </td>
                          {/* Front nine */}
                          {frontNine.map((hole: any) => {
                            const maxScore = (hole.par * 2) + Math.floor(player.handicapIndex / 18) + (player.handicapIndex % 18 >= hole.handicapRanking ? 1 : 0);
                            return (
                              <td key={hole.id} className="px-2 py-3">
                                <Input
                                  type="number"
                                  min="1"
                                  max={maxScore}
                                  className="w-12 h-8 text-center"
                                  value={getScore(player.id, hole.id)}
                                  onChange={(e) => handleScoreChange(player.id, hole.id, parseInt(e.target.value) || 0)}
                                  title={`Max score: ${maxScore} (Par ${hole.par} + ${maxScore - hole.par} strokes)`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-semibold">{frontTotal || 0}</td>
                          {/* Back nine */}
                          {backNine.map((hole: any) => {
                            const maxScore = (hole.par * 2) + Math.floor(player.handicapIndex / 18) + (player.handicapIndex % 18 >= hole.handicapRanking ? 1 : 0);
                            return (
                              <td key={hole.id} className="px-2 py-3">
                                <Input
                                  type="number"
                                  min="1"
                                  max={maxScore}
                                  className="w-12 h-8 text-center"
                                  value={getScore(player.id, hole.id)}
                                  onChange={(e) => handleScoreChange(player.id, hole.id, parseInt(e.target.value) || 0)}
                                  title={`Max score: ${maxScore} (Par ${hole.par} + ${maxScore - hole.par} strokes)`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-semibold">{backTotal || 0}</td>
                          <td className="px-3 py-3 text-center font-bold text-lg">{totalScore || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Golf Rules Applied:</p>
                    <ul className="text-blue-800 space-y-1">
                      <li>• Maximum score per hole is double par + handicap strokes</li>
                      <li>• Handicap strokes are assigned based on hole difficulty (1-18)</li>
                      <li>• Net scores automatically calculated using proper golf handicap system</li>
                      <li>• Players with the same net score share the same position</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600 flex items-center">
                  <Save className="h-4 w-4 mr-1" />
                  Enter scores and save when complete
                </div>
                <Button
                  onClick={handleSaveScores}
                  disabled={saveScoresMutation.isPending || Object.keys(scores).length === 0}
                  className="bg-golf-green hover:bg-golf-green/90"
                >
                  {saveScoresMutation.isPending ? "Saving..." : "Save Scores"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
