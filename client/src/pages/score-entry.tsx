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
import { Save, CheckCircle, Info } from "lucide-react";

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-golf-dark">Score Entry</CardTitle>
            <div className="text-sm text-gray-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Admin access required
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Round Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Select Round</Label>
            <Select
              value={selectedRoundId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedRoundId(parseInt(value));
                setSelectedScorecardId(null);
                setScores({});
              }}
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Choose a round" />
              </SelectTrigger>
              <SelectContent>
                {rounds?.map((round: any) => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    Round {round.roundNumber} - {round.date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scorecard Selection */}
          {selectedRoundId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-golf-dark">Scorecard {scorecard.name}</h3>
                    {selectedScorecardId === scorecard.id ? (
                      <CheckCircle className="h-5 w-5 text-golf-green" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {scorecard.players?.map((player: any) => (
                      <div key={player.id}>
                        {player.firstName} {player.lastName} ({player.handicap})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score Entry Grid */}
          {selectedScorecardId && selectedScorecard && holes && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Player
                      </th>
                      {holes.slice(0, 9).map((hole: any) => (
                        <th key={hole.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {hole.holeNumber}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Out
                      </th>
                      {holes.slice(9, 18).map((hole: any) => (
                        <th key={hole.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {hole.holeNumber}
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
                                <div className="text-xs text-gray-500">HCP: {player.handicap}</div>
                              </div>
                            </div>
                          </td>
                          {/* Front nine */}
                          {frontNine.map((hole: any) => (
                            <td key={hole.id} className="px-2 py-3">
                              <Input
                                type="number"
                                min="1"
                                max="12"
                                className="w-12 h-8 text-center"
                                value={getScore(player.id, hole.id)}
                                onChange={(e) => handleScoreChange(player.id, hole.id, parseInt(e.target.value) || 0)}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center font-semibold">{frontTotal || 0}</td>
                          {/* Back nine */}
                          {backNine.map((hole: any) => (
                            <td key={hole.id} className="px-2 py-3">
                              <Input
                                type="number"
                                min="1"
                                max="12"
                                className="w-12 h-8 text-center"
                                value={getScore(player.id, hole.id)}
                                onChange={(e) => handleScoreChange(player.id, hole.id, parseInt(e.target.value) || 0)}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center font-semibold">{backTotal || 0}</td>
                          <td className="px-3 py-3 text-center font-bold text-lg">{totalScore || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
