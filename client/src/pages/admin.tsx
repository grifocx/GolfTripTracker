import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Settings, MapPin, Calendar, Users, Edit, 
  List, Calculator, Download, Info 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, insertRoundSchema, insertTournamentSchema } from "@shared/schema";
import type { InsertCourse, InsertRound, InsertTournament } from "@shared/schema";

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [newCourseDialogOpen, setNewCourseDialogOpen] = useState(false);
  const [newRoundDialogOpen, setNewRoundDialogOpen] = useState(false);
  const [newTournamentDialogOpen, setNewTournamentDialogOpen] = useState(false);

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

  const courseForm = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      name: "",
      location: "",
      par: 72,
      yardage: 6500,
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

  const tournamentForm = useForm<InsertTournament>({
    resolver: zodResolver(insertTournamentSchema),
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dailyBuyIn: 0,
      overallBuyIn: 0,
      status: "active",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      toast({
        title: "Course Created",
        description: "The golf course has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setNewCourseDialogOpen(false);
      courseForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
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

  const createTournamentMutation = useMutation({
    mutationFn: async (data: InsertTournament) => {
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

  const onCreateCourse = (data: InsertCourse) => {
    createCourseMutation.mutate(data);
  };

  const onCreateRound = (data: InsertRound) => {
    createRoundMutation.mutate({
      ...data,
      tournamentId: tournament?.id || 0,
    });
  };

  const onCreateTournament = (data: InsertTournament) => {
    createTournamentMutation.mutate(data);
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
      {/* Tournament Management Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold golf-dark">Tournament Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tournament Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Tournament</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Tournament Name</Label>
                  <Input
                    value={tournament?.name || ""}
                    readOnly
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Daily Buy-in ($)</Label>
                  <Input
                    value={tournament?.dailyBuyIn || ""}
                    readOnly
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Overall Buy-in ($)</Label>
                  <Input
                    value={tournament?.overallBuyIn || ""}
                    readOnly
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <Dialog open={newRoundDialogOpen} onOpenChange={setNewRoundDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center justify-center space-x-2 p-3 bg-golf-green text-white hover:bg-golf-green/90">
                      <Plus className="h-4 w-4" />
                      <span>Create New Round</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Round</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={roundForm.handleSubmit(onCreateRound)} className="space-y-4">
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
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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

                <Button className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white hover:bg-blue-700">
                  <Users className="h-4 w-4" />
                  <span>Assign Scorecards</span>
                </Button>
                <Button className="flex items-center justify-center space-x-2 p-3 bg-golf-gold text-white hover:bg-golf-gold/90">
                  <Calculator className="h-4 w-4" />
                  <span>Calculate Payouts</span>
                </Button>
                <Button className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white hover:bg-gray-700">
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-golf-green" />
                  <span>Golf Courses</span>
                </CardTitle>
                <Dialog open={newCourseDialogOpen} onOpenChange={setNewCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-golf-green hover:bg-golf-green/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Course</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={courseForm.handleSubmit(onCreateCourse)} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Course Name</Label>
                        <Input
                          id="name"
                          {...courseForm.register("name")}
                          placeholder="e.g., Pebble Beach Golf Links"
                        />
                        {courseForm.formState.errors.name && (
                          <p className="text-sm text-red-600">{courseForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...courseForm.register("location")}
                          placeholder="e.g., Pebble Beach, CA"
                        />
                        {courseForm.formState.errors.location && (
                          <p className="text-sm text-red-600">{courseForm.formState.errors.location.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="par">Par</Label>
                          <Input
                            id="par"
                            type="number"
                            min="60"
                            max="80"
                            {...courseForm.register("par", { valueAsNumber: true })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="yardage">Yardage</Label>
                          <Input
                            id="yardage"
                            type="number"
                            min="4000"
                            max="8000"
                            {...courseForm.register("yardage", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={createCourseMutation.isPending}
                        className="w-full bg-golf-green hover:bg-golf-green/90"
                      >
                        {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!courses || courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courses added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course: any) => (
                    <Card key={course.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div>
                            <h4 className="font-semibold golf-dark">{course.name}</h4>
                            <p className="text-sm text-gray-600">{course.location}</p>
                            <div className="text-sm text-gray-500 mt-1">
                              Par: {course.par} | Yardage: {course.yardage}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              className="bg-golf-green hover:bg-golf-green/90"
                            >
                              <List className="h-3 w-3 mr-1" />
                              Holes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-golf-green" />
                <span>Tournament Rounds</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!rounds || rounds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No rounds created yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Round
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rounds.map((round: any) => (
                        <tr key={round.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-golf-green rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">{round.roundNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {courses?.find((c: any) => c.id === round.courseId)?.name || "Unknown Course"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(round.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              round.status === "completed" ? "bg-green-100 text-green-800" :
                              round.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {round.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-golf-green hover:text-golf-green/80"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Enter Scores
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
