import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, MapPin, Users, DollarSign, Trophy, Settings, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTournamentSchema, insertRoundSchema, type InsertTournament, type InsertRound } from "@shared/schema";

export default function TournamentManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [newTournamentDialogOpen, setNewTournamentDialogOpen] = useState(false);
  const [newRoundDialogOpen, setNewRoundDialogOpen] = useState(false);

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournament/active"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: rounds } = useQuery({
    queryKey: ["/api/tournaments", tournament?.id, "rounds"],
    enabled: !!tournament?.id,
  });

  const tournamentForm = useForm<InsertTournament>({
    resolver: zodResolver(insertTournamentSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dailyBuyIn: 0,
      overallBuyIn: 0,
      isActive: true,
    },
  });

  const roundForm = useForm<InsertRound>({
    resolver: zodResolver(insertRoundSchema),
    defaultValues: {
      tournamentId: tournament?.id || 0,
      courseId: 0,
      roundNumber: 1,
      date: new Date().toISOString().split('T')[0],
      status: "pending",
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: InsertTournament) => {
      console.log("Creating tournament with data:", data);
      console.log("Form errors:", tournamentForm.formState.errors);
      return apiRequest("POST", "/api/tournaments", data);
    },
    onSuccess: () => {
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/active"] });
      setNewTournamentDialogOpen(false);
      tournamentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const createRoundMutation = useMutation({
    mutationFn: async (data: InsertRound) => {
      return apiRequest("POST", "/api/rounds", data);
    },
    onSuccess: () => {
      toast({
        title: "Round Created",
        description: "The tournament round has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "rounds"] });
      setNewRoundDialogOpen(false);
      roundForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create round",
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
              <p>Only administrators can access tournament management features.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onCreateTournament = (data: InsertTournament) => {
    createTournamentMutation.mutate(data);
  };

  const onCreateRound = (data: InsertRound) => {
    createRoundMutation.mutate({
      ...data,
      tournamentId: tournament?.id || 0,
    });
  };

  // If no tournament exists, show tournament creation interface
  if (!tournament) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold golf-dark">Create Your First Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-golf-green" />
              <h3 className="text-lg font-semibold mb-2">No Tournament Found</h3>
              <p className="text-gray-600 mb-6">
                You need to create a tournament first before you can manage rounds and scorecards.
              </p>
              <Dialog open={newTournamentDialogOpen} onOpenChange={setNewTournamentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-golf-green hover:bg-golf-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tournament
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Tournament</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={tournamentForm.handleSubmit(onCreateTournament)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Tournament Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Annual Golf Trip 2025"
                        {...tournamentForm.register("name")}
                      />
                      {tournamentForm.formState.errors.name && (
                        <p className="text-sm text-red-600">{tournamentForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="courseId">Golf Course</Label>
                      <Select
                        value={tournamentForm.watch("courseId")?.toString() || ""}
                        onValueChange={(value) => tournamentForm.setValue("courseId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a golf course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses?.map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name} - {course.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {tournamentForm.formState.errors.courseId && (
                        <p className="text-sm text-red-600">{tournamentForm.formState.errors.courseId.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          {...tournamentForm.register("startDate")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          {...tournamentForm.register("endDate")}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dailyBuyIn">Daily Buy-in ($)</Label>
                        <Input
                          id="dailyBuyIn"
                          type="number"
                          step="0.01"
                          min="0"
                          {...tournamentForm.register("dailyBuyIn", { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="overallBuyIn">Overall Buy-in ($)</Label>
                        <Input
                          id="overallBuyIn"
                          type="number"
                          step="0.01"
                          min="0"
                          {...tournamentForm.register("overallBuyIn", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={createTournamentMutation.isPending}
                      className="w-full bg-golf-green hover:bg-golf-green/90"
                    >
                      {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold golf-dark flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Tournament Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tournament Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Tournament</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-golf-green" />
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-gray-600">
                      {tournament.startDate} to {tournament.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-golf-green" />
                  <div>
                    <p className="font-medium">Course Information</p>
                    <p className="text-sm text-gray-600">Course ID: {tournament.courseId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-golf-green" />
                  <div>
                    <p className="font-medium">Buy-ins</p>
                    <p className="text-sm text-gray-600">
                      Daily: ${tournament.dailyBuyIn} | Overall: ${tournament.overallBuyIn}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tournament Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-golf-green/10 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-golf-green">
                    {rounds?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Rounds</div>
                </div>
                <div className="bg-golf-gold/10 p-3 rounded-lg">
                  <div className="text-2xl font-bold golf-gold">
                    {tournament.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Rounds */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tournament Rounds</CardTitle>
            <Dialog open={newRoundDialogOpen} onOpenChange={setNewRoundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Round
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Round</DialogTitle>
                </DialogHeader>
                <form onSubmit={roundForm.handleSubmit(onCreateRound)} className="space-y-4">
                  <div>
                    <Label htmlFor="roundNumber">Round Number</Label>
                    <Input
                      id="roundNumber"
                      type="number"
                      min="1"
                      {...roundForm.register("roundNumber", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="courseId">Course</Label>
                    <Select
                      value={roundForm.watch("courseId")?.toString() || ""}
                      onValueChange={(value) => roundForm.setValue("courseId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} - {course.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...roundForm.register("date")}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createRoundMutation.isPending}
                    className="w-full bg-golf-green hover:bg-golf-green/90"
                  >
                    {createRoundMutation.isPending ? "Creating..." : "Create Round"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rounds && rounds.length > 0 ? (
            <div className="space-y-3">
              {rounds.map((round: any) => (
                <div key={round.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Round {round.roundNumber}</Badge>
                    <div>
                      <p className="font-medium">{round.course?.name}</p>
                      <p className="text-sm text-gray-600">{round.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={round.status === "completed" ? "default" : "secondary"}>
                      {round.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No rounds created yet. Add your first round to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}