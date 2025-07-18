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
import { Calendar, Plus, MapPin, Users, DollarSign, Trophy, Settings, Info, Play, Pause, Square } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTournamentSchema, insertRoundSchema, type InsertTournament, type InsertRound } from "@shared/schema";

export default function TournamentManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [newTournamentDialogOpen, setNewTournamentDialogOpen] = useState(false);
  const [newRoundDialogOpen, setNewRoundDialogOpen] = useState(false);
  const [editRoundDialogOpen, setEditRoundDialogOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);

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
      status: "draft",
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

  const editRoundForm = useForm<InsertRound>({
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

  const updateRoundMutation = useMutation({
    mutationFn: async (data: InsertRound & { id: number }) => {
      return apiRequest("PUT", `/api/rounds/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Round Updated",
        description: "The tournament round has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "rounds"] });
      setEditRoundDialogOpen(false);
      editRoundForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update round",
        variant: "destructive",
      });
    },
  });

  const updateTournamentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "draft" | "in_progress" | "completed" }) => {
      return apiRequest("PATCH", `/api/tournaments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Tournament Status Updated",
        description: "The tournament status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tournament status",
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

  const onEditRound = (round: any) => {
    setSelectedRound(round);
    editRoundForm.reset({
      tournamentId: round.tournamentId,
      courseId: round.courseId,
      roundNumber: round.roundNumber,
      date: round.date,
      status: round.status,
    });
    setEditRoundDialogOpen(true);
  };

  const onUpdateRound = (data: InsertRound) => {
    if (selectedRound) {
      updateRoundMutation.mutate({
        ...data,
        id: selectedRound.id,
        tournamentId: tournament?.id || 0,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Settings className="h-4 w-4" />;
      case "in_progress":
        return <Play className="h-4 w-4" />;
      case "completed":
        return <Square className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold golf-dark flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Tournament Management
            </CardTitle>
            <Dialog open={newTournamentDialogOpen} onOpenChange={setNewTournamentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-golf-green hover:bg-golf-green/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Tournament
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tournament Info */}
            <div className="space-y-4">
              <div className="bg-golf-green/10 p-4 rounded-lg">
                <h3 className="font-semibold text-golf-green flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Tournament
                </h3>
                <p className="text-2xl font-bold text-golf-dark">{tournament.name}</p>
                <p className="text-sm text-gray-600">
                  {tournament.startDate} - {tournament.endDate}
                </p>
              </div>
              
              {/* Tournament Status Management */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3">Tournament Status</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(tournament.status || "draft")} flex items-center gap-1`}>
                      {getStatusIcon(tournament.status || "draft")}
                      {getStatusLabel(tournament.status || "draft")}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {tournament.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTournamentStatusMutation.mutate({ id: tournament.id, status: "in_progress" })}
                        disabled={updateTournamentStatusMutation.isPending}
                        className="bg-green-50 hover:bg-green-100 text-green-800 border-green-200"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {tournament.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTournamentStatusMutation.mutate({ id: tournament.id, status: "completed" })}
                        disabled={updateTournamentStatusMutation.isPending}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {tournament.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTournamentStatusMutation.mutate({ id: tournament.id, status: "in_progress" })}
                        disabled={updateTournamentStatusMutation.isPending}
                        className="bg-green-50 hover:bg-green-100 text-green-800 border-green-200"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {tournament.status === "draft" && "Tournament is being set up. Start when ready to begin scoring."}
                  {tournament.status === "in_progress" && "Tournament is active. Players can submit scores."}
                  {tournament.status === "completed" && "Tournament has ended. Results are final."}
                </div>
              </div>
            </div>
            
            {/* Tournament Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tournament Stats</h3>
              <div className="space-y-3">
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
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-golf-green/10 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-golf-green">
                    {rounds?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Rounds</div>
                </div>
                <div className="bg-golf-gold/10 p-3 rounded-lg">
                  <div className="text-lg font-bold golf-gold">
                    {getStatusLabel(tournament.status || "draft")}
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
                    <Button variant="ghost" size="sm" onClick={() => onEditRound(round)}>
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

      {/* Edit Round Dialog */}
      <Dialog open={editRoundDialogOpen} onOpenChange={setEditRoundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Round {selectedRound?.roundNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editRoundForm.handleSubmit(onUpdateRound)} className="space-y-4">
            <div>
              <Label htmlFor="editRoundNumber">Round Number</Label>
              <Input
                id="editRoundNumber"
                type="number"
                min="1"
                {...editRoundForm.register("roundNumber", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="editCourseId">Course</Label>
              <Select
                value={editRoundForm.watch("courseId")?.toString() || ""}
                onValueChange={(value) => editRoundForm.setValue("courseId", parseInt(value))}
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
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                {...editRoundForm.register("date")}
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editRoundForm.watch("status") || "pending"}
                onValueChange={(value) => editRoundForm.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={updateRoundMutation.isPending}
                className="flex-1 bg-golf-green hover:bg-golf-green/90"
              >
                {updateRoundMutation.isPending ? "Updating..." : "Update Round"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRoundDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}