import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Edit, Info, Settings, Users, Database } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import type { InsertCourse } from "@shared/schema";

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [newCourseDialogOpen, setNewCourseDialogOpen] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const courseForm = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      name: "",
      location: "",
      par: 72,
      yardage: 6500,
      courseRating: 72.0,
      slopeRating: 113,
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
              <p>Only administrators can access admin features.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onCreateCourse = (data: InsertCourse) => {
    createCourseMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Admin Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold golf-dark flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-golf-green/10 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-golf-green" />
                <div>
                  <div className="text-2xl font-bold text-golf-green">
                    {courses?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Golf Courses</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {users?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Registered Users</div>
                </div>
              </div>
            </div>
            <div className="bg-golf-gold/10 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 golf-gold" />
                <div>
                  <div className="text-2xl font-bold golf-gold">Active</div>
                  <div className="text-sm text-gray-600">System Status</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Course Management
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
                  <DialogTitle>Create New Golf Course</DialogTitle>
                </DialogHeader>
                <form onSubmit={courseForm.handleSubmit(onCreateCourse)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Augusta National"
                      {...courseForm.register("name")}
                    />
                    {courseForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{courseForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Augusta, Georgia"
                      {...courseForm.register("location")}
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
                        min="70"
                        max="74"
                        {...courseForm.register("par", { valueAsNumber: true })}
                      />
                      {courseForm.formState.errors.par && (
                        <p className="text-sm text-red-600">{courseForm.formState.errors.par.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="yardage">Yardage</Label>
                      <Input
                        id="yardage"
                        type="number"
                        min="5000"
                        max="8000"
                        {...courseForm.register("yardage", { valueAsNumber: true })}
                      />
                      {courseForm.formState.errors.yardage && (
                        <p className="text-sm text-red-600">{courseForm.formState.errors.yardage.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="courseRating">Course Rating</Label>
                      <Input
                        id="courseRating"
                        type="number"
                        step="0.1"
                        min="65.0"
                        max="80.0"
                        placeholder="72.5"
                        {...courseForm.register("courseRating", { valueAsNumber: true })}
                      />
                      {courseForm.formState.errors.courseRating && (
                        <p className="text-sm text-red-600">{courseForm.formState.errors.courseRating.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="slopeRating">Slope Rating</Label>
                      <Input
                        id="slopeRating"
                        type="number"
                        min="55"
                        max="155"
                        placeholder="113"
                        {...courseForm.register("slopeRating", { valueAsNumber: true })}
                      />
                      {courseForm.formState.errors.slopeRating && (
                        <p className="text-sm text-red-600">{courseForm.formState.errors.slopeRating.message}</p>
                      )}
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
          {courses && courses.length > 0 ? (
            <div className="space-y-3">
              {courses.map((course: any) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-golf-green" />
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-gray-600">{course.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Par {course.par}</Badge>
                    <Badge variant="outline">{course.yardage} yards</Badge>
                    <Badge variant="outline">Rating {course.courseRating}</Badge>
                    <Badge variant="outline">Slope {course.slopeRating}</Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No courses created yet. Add your first course to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-golf-green/10 rounded-full flex items-center justify-center">
                      <span className="text-golf-green font-medium">
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-600">
                        {user.isAdmin ? "Administrator" : "Player"} • HCP: {user.handicapIndex}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "Player"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}