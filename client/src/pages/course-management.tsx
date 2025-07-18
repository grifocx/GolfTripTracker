import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Edit, Trash2, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Hole, InsertCourse, InsertHole } from "@shared/schema";

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  location: z.string().min(1, "Location is required"),
  par: z.number().min(18, "Par must be at least 18").max(120, "Par must be reasonable"),
  yardage: z.number().min(1000, "Yardage must be at least 1000").max(10000, "Yardage must be reasonable"),
  courseRating: z.number().min(60, "Course rating must be reasonable").max(80, "Course rating must be reasonable"),
  slopeRating: z.number().min(55, "Slope rating must be at least 55").max(155, "Slope rating must be at most 155").default(113),
});

const holeSchema = z.object({
  holeNumber: z.number().min(1, "Hole number must be at least 1").max(18, "Hole number must be at most 18"),
  par: z.number().min(3, "Par must be at least 3").max(6, "Par must be at most 6"),
  yardage: z.number().min(50, "Yardage must be at least 50").max(700, "Yardage must be reasonable"),
  handicapRanking: z.number().min(1, "Handicap ranking must be at least 1").max(18, "Handicap ranking must be at most 18"),
});

interface CourseWithHoles extends Course {
  holes: Hole[];
  holesCount: number;
}

export default function CourseManagement() {
  const [selectedCourse, setSelectedCourse] = useState<CourseWithHoles | null>(null);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateHoleOpen, setIsCreateHoleOpen] = useState(false);
  const { toast } = useToast();

  // Fetch courses with hole data
  const { data: courses = [], isLoading } = useQuery<CourseWithHoles[]>({
    queryKey: ['/api/courses/with-holes'],
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (data: InsertCourse) => apiRequest('/api/courses', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCreateCourseOpen(false);
      toast({ title: "Course created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    },
  });

  // Create hole mutation
  const createHoleMutation = useMutation({
    mutationFn: (data: InsertHole) => apiRequest('/api/holes', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCreateHoleOpen(false);
      toast({ title: "Hole created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create hole", variant: "destructive" });
    },
  });

  // Delete hole mutation
  const deleteHoleMutation = useMutation({
    mutationFn: (holeId: number) => apiRequest(`/api/holes/${holeId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({ title: "Hole deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete hole", variant: "destructive" });
    },
  });

  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      location: "",
      par: 72,
      yardage: 6800,
      courseRating: 72.0,
      slopeRating: 113,
    },
  });

  const holeForm = useForm<z.infer<typeof holeSchema>>({
    resolver: zodResolver(holeSchema),
    defaultValues: {
      holeNumber: 1,
      par: 4,
      yardage: 400,
      handicapRanking: 1,
    },
  });

  const onCreateCourse = (data: z.infer<typeof courseSchema>) => {
    createCourseMutation.mutate(data);
  };

  const onCreateHole = (data: z.infer<typeof holeSchema>) => {
    if (!selectedCourse) return;
    
    createHoleMutation.mutate({
      ...data,
      courseId: selectedCourse.id,
    });
  };

  const handleDeleteHole = (holeId: number) => {
    if (confirm("Are you sure you want to delete this hole?")) {
      deleteHoleMutation.mutate(holeId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Manage golf courses and hole configurations</p>
        </div>
        <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>Add a new golf course to the system</DialogDescription>
            </DialogHeader>
            <Form {...courseForm}>
              <form onSubmit={courseForm.handleSubmit(onCreateCourse)} className="space-y-4">
                <FormField
                  control={courseForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={courseForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={courseForm.control}
                    name="par"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Par</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="72" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={courseForm.control}
                    name="yardage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Yardage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="6800" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={courseForm.control}
                    name="courseRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Rating</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="72.0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={courseForm.control}
                    name="slopeRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slope Rating</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="113" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateCourseOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCourseMutation.isPending}>
                    {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Course Overview</TabsTrigger>
          <TabsTrigger value="holes">Hole Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => setSelectedCourse(course)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {course.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {course.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Par</div>
                      <div className="text-2xl font-bold">{course.par}</div>
                    </div>
                    <div>
                      <div className="font-medium">Yardage</div>
                      <div className="text-2xl font-bold">{course.yardage.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Course Rating</div>
                      <div className="text-lg">{course.courseRating}</div>
                    </div>
                    <div>
                      <div className="font-medium">Holes</div>
                      <div className={`text-lg font-semibold ${course.holesCount === 18 ? 'text-green-600' : 'text-red-600'}`}>
                        {course.holesCount}/18
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="holes">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {selectedCourse ? `${selectedCourse.name} - Holes` : "Select a course to view holes"}
              </h2>
              {selectedCourse && (
                <Dialog open={isCreateHoleOpen} onOpenChange={setIsCreateHoleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Hole
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Hole</DialogTitle>
                      <DialogDescription>Add a hole to {selectedCourse.name}</DialogDescription>
                    </DialogHeader>
                    <Form {...holeForm}>
                      <form onSubmit={holeForm.handleSubmit(onCreateHole)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={holeForm.control}
                            name="holeNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hole Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="18" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={holeForm.control}
                            name="par"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Par</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="3" 
                                    max="6" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={holeForm.control}
                            name="yardage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Yardage</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="50" 
                                    max="700" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={holeForm.control}
                            name="handicapRanking"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Handicap Ranking</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="18" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateHoleOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createHoleMutation.isPending}>
                            {createHoleMutation.isPending ? "Creating..." : "Add Hole"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {selectedCourse ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCourse.name} Hole Details</CardTitle>
                  <CardDescription>
                    {selectedCourse.holes.length} of 18 holes configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hole</TableHead>
                        <TableHead>Par</TableHead>
                        <TableHead>Yardage</TableHead>
                        <TableHead>Handicap</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCourse.holes
                        .sort((a, b) => a.holeNumber - b.holeNumber)
                        .map((hole) => (
                        <TableRow key={hole.id}>
                          <TableCell className="font-medium">{hole.holeNumber}</TableCell>
                          <TableCell>{hole.par}</TableCell>
                          <TableCell>{hole.yardage}</TableCell>
                          <TableCell>{hole.handicapRanking}</TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteHole(hole.id)}
                              disabled={deleteHoleMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedCourse.holes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No holes configured for this course. Add holes to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Course</h3>
                  <p className="text-muted-foreground">
                    Choose a course from the overview tab to view and manage its holes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}