import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Users, Calendar, Trophy, ChevronRight, CheckCircle, Clock, Settings,
  MapPin, DollarSign, Target, UserPlus, CalendarPlus, FileText
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTournamentSchema, insertRoundSchema, type InsertTournament, type InsertRound } from "@shared/schema";

export default function TournamentSetup() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [newTournamentDialogOpen, setNewTournamentDialogOpen] = useState(false);
  const [newRoundDialogOpen, setNewRoundDialogOpen] = useState(false);
  const [addPlayersDialogOpen, setAddPlayersDialogOpen] = useState(false);

  const { data: tournaments } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: tournamentPlayers } = useQuery({
    queryKey: ["/api/tournaments", selectedTournament?.id, "players"],
    enabled: !!selectedTournament?.id,
  });

  const { data: rounds } = useQuery({
    queryKey: ["/api/tournaments", selectedTournament?.id, "rounds"],
    enabled: !!selectedTournament?.id,
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
      tournamentId: selectedTournament?.id || 0,
      courseId: 0,
      roundNumber: 1,
      date: new Date().toISOString().split('T')[0],
      status: "pending",
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: InsertTournament) => {
      return apiRequest("POST", "/api/tournaments", data);
    },
    onSuccess: (tournament) => {
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully!",
      });
      setSelectedTournament(tournament);
      setCurrentStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
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

  const addPlayersMutation = useMutation({
    mutationFn: async (data: { tournamentId: number; playerIds: number[] }) => {
      return apiRequest("POST", `/api/tournaments/${data.tournamentId}/players`, {
        playerIds: data.playerIds,
      });
    },
    onSuccess: () => {
      toast({
        title: "Players Added",
        description: "Players have been added to the tournament successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", selectedTournament?.id, "players"] });
      setAddPlayersDialogOpen(false);
      setSelectedPlayers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add players",
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
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", selectedTournament?.id, "rounds"] });
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

  const onCreateTournament = (data: InsertTournament) => {
    createTournamentMutation.mutate(data);
  };

  const onCreateRound = (data: InsertRound) => {
    createRoundMutation.mutate({
      ...data,
      tournamentId: selectedTournament?.id || 0,
    });
  };

  const onAddPlayers = () => {
    if (selectedTournament && selectedPlayers.length > 0) {
      addPlayersMutation.mutate({
        tournamentId: selectedTournament.id,
        playerIds: selectedPlayers,
      });
    }
  };

  const steps = [
    {
      number: 1,
      title: "Create Tournament",
      description: "Set up tournament details",
      icon: Trophy,
      completed: !!selectedTournament,
    },
    {
      number: 2,
      title: "Add Players",
      description: "Select tournament participants",
      icon: Users,
      completed: tournamentPlayers && tournamentPlayers.length > 0,
    },
    {
      number: 3,
      title: "Create Rounds",
      description: "Set up tournament rounds",
      icon: Calendar,
      completed: rounds && rounds.length > 0,
    },
    {
      number: 4,
      title: "Create Scorecards",
      description: "Assign players to groups",
      icon: FileText,
      completed: false, // TODO: Check if scorecards exist
    },
    {
      number: 5,
      title: "Enter Scores",
      description: "Record player scores",
      icon: Target,
      completed: false, // TODO: Check if scores exist
    },
  ];

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
              <p>Only administrators can set up tournaments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Setup Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-golf-dark flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Tournament Setup Wizard
          </CardTitle>
          <p className="text-gray-600">Follow these steps to create and manage your golf tournament</p>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-golf-green text-white border-golf-green' 
                    : currentStep === step.number 
                      ? 'bg-golf-green/10 text-golf-green border-golf-green' 
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="ml-4 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.completed ? 'text-golf-green' : 
                    currentStep === step.number ? 'text-golf-dark' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Create Tournament */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-golf-green" />
              Step 1: Create Tournament
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                First, let's create your tournament. Choose a name, location, dates, and buy-in amounts.
              </p>
              
              <Dialog open={newTournamentDialogOpen} onOpenChange={setNewTournamentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-golf-green hover:bg-golf-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Tournament
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                      <Label htmlFor="courseId">Primary Golf Course</Label>
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

              {/* Existing Tournaments */}
              {tournaments && tournaments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Or Select Existing Tournament</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournaments.map((tournament: any) => (
                      <Card key={tournament.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                        setSelectedTournament(tournament);
                        setCurrentStep(2);
                      }}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{tournament.name}</h4>
                              <p className="text-sm text-gray-600">{tournament.startDate} - {tournament.endDate}</p>
                            </div>
                            <Badge variant={tournament.isActive ? "default" : "secondary"}>
                              {tournament.isActive ? "Active" : "Completed"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Players */}
      {currentStep === 2 && selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-golf-green" />
              Step 2: Add Players to "{selectedTournament.name}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select the players who will participate in this tournament.
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Current Players: {tournamentPlayers?.length || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Dialog open={addPlayersDialogOpen} onOpenChange={setAddPlayersDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-golf-green hover:bg-golf-green/90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Players
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Players to Tournament</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="max-h-64 overflow-y-auto">
                          {users?.map((user: any) => (
                            <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                id={`player-${user.id}`}
                                checked={selectedPlayers.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPlayers([...selectedPlayers, user.id]);
                                  } else {
                                    setSelectedPlayers(selectedPlayers.filter(id => id !== user.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`player-${user.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-600">
                                  Handicap: {user.handicapIndex} | @{user.username}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={onAddPlayers}
                          disabled={selectedPlayers.length === 0 || addPlayersMutation.isPending}
                          className="w-full bg-golf-green hover:bg-golf-green/90"
                        >
                          {addPlayersMutation.isPending ? "Adding..." : `Add ${selectedPlayers.length} Players`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Current Players List */}
              {tournamentPlayers && tournamentPlayers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tournament Players</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournamentPlayers.map((player: any) => (
                      <Card key={player.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-golf-green/10 rounded-full flex items-center justify-center">
                              <span className="text-golf-green font-semibold">
                                {player.firstName[0]}{player.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{player.firstName} {player.lastName}</div>
                              <div className="text-sm text-gray-600">
                                Handicap: {player.handicapIndex}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {tournamentPlayers && tournamentPlayers.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(3)} className="bg-golf-green hover:bg-golf-green/90">
                    Next: Create Rounds
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Create Rounds */}
      {currentStep === 3 && selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-golf-green" />
              Step 3: Create Rounds for "{selectedTournament.name}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Create the rounds for your tournament. Each round represents a day of play.
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Current Rounds: {rounds?.length || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Dialog open={newRoundDialogOpen} onOpenChange={setNewRoundDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-golf-green hover:bg-golf-green/90">
                        <CalendarPlus className="h-4 w-4 mr-2" />
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
                            placeholder="1"
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
              </div>

              {/* Current Rounds List */}
              {rounds && rounds.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tournament Rounds</h3>
                  <div className="space-y-3">
                    {rounds.map((round: any) => (
                      <Card key={round.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">Round {round.roundNumber}</Badge>
                              <div>
                                <p className="font-medium">{round.course?.name || 'Course TBD'}</p>
                                <p className="text-sm text-gray-600">{round.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={round.status === "completed" ? "default" : "secondary"}>
                                {round.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {rounds && rounds.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(4)} className="bg-golf-green hover:bg-golf-green/90">
                    Next: Create Scorecards
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps 4 & 5: Coming Soon */}
      {currentStep >= 4 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-golf-green" />
              <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
              <p className="text-gray-600 mb-4">
                Great progress! You've set up your tournament, added players, and created rounds.
              </p>
              <p className="text-sm text-gray-500">
                Now you can go to "Score Entry" to create scorecards and enter scores for your tournament.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}