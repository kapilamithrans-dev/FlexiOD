import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Upload, Users, Calendar, FileText, BarChart3, Clock, CheckCircle } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalODRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  timetablesUploaded: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch(
        "https://flexiod.onrender.com/api/admin/stats",
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch staff schedule");
      }

      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage department timetables and monitor OD requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-total-students">
                {stats?.totalStudents ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-total-staff">
                {stats?.totalStaff ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Timetables</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-timetables">
                {stats?.timetablesUploaded ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">students with timetables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total OD Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-total-requests">
                {stats?.totalODRequests ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">submitted to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-pending">
                {stats?.pendingRequests ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">awaiting staff response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-approved">
                {stats?.approvedRequests ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">requests approved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Upload data files and manage department settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/upload-timetables">
              <Button variant="outline" className="w-full h-auto py-6" data-testid="button-upload-timetables">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="font-medium">Upload Timetables</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Upload student timetable files (XLSX/CSV)
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/upload-mappings">
              <Button variant="outline" className="w-full h-auto py-6" data-testid="button-upload-mappings">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="font-medium">Upload Mappings</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Student-staff subject mappings
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/upload-duty">
              <Button variant="outline" className="w-full h-auto py-6" data-testid="button-upload-duty">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-primary" />
                  <span className="font-medium">Staff Duty Schedule</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Upload staff duty schedules
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-auto py-6" data-testid="button-manage-users">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <span className="font-medium">Manage Users</span>
                  <span className="text-xs text-muted-foreground text-center">
                    View and manage all users
                  </span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Instructions</CardTitle>
          <CardDescription>
            Guidelines for preparing and uploading data files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Student Timetables (XLSX/CSV)</h4>
            <p className="text-sm text-muted-foreground">
              Required columns: StudentID, StudentName, RollNumber, DayOfWeek (1-6), Period (1-8), SubjectCode, SubjectName, StaffID, StaffName, StartTime, EndTime
            </p>
          </div>
          <div className="p-4 rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Student-Staff Mappings (XLSX/CSV)</h4>
            <p className="text-sm text-muted-foreground">
              Required columns: StudentID, StaffID, SubjectCode, SubjectName
            </p>
          </div>
          <div className="p-4 rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Staff Duty Schedules (XLSX/CSV)</h4>
            <p className="text-sm text-muted-foreground">
              Required columns: StaffID, DayOfWeek (1-6), Period (1-8), SubjectCode, SubjectName, StartTime, EndTime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
