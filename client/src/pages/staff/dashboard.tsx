import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, ClipboardCheck, Users, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import type { ODRequest, StaffDutySchedule, AttendanceSummary } from "@shared/schema";

export default function StaffDashboard() {
  const { user } = useAuth();

  const { data: odRequests, isLoading: loadingRequests } = useQuery<ODRequest[]>({
    queryKey: ["/api/staff/od-requests", user?.username],
    enabled: !!user?.username,
  });

  const { data: todaySchedule, isLoading: loadingSchedule } = useQuery<StaffDutySchedule[]>({
    queryKey: ["/api/staff/schedule/today", user?.username],
    enabled: !!user?.username,
  });

  const { data: studentsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/staff/students/count", user?.username],
    enabled: !!user?.username,
  });

  const pendingCount = odRequests?.filter((r) => 
    r.staffApprovals.some((a) => a.staffId === user?.username && a.status === "pending")
  ).length ?? 0;

  const approvedCount = odRequests?.filter((r) =>
    r.staffApprovals.some((a) => a.staffId === user?.username && a.status === "approved")
  ).length ?? 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Manage your classes and OD requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-today-classes">
                {todaySchedule?.length ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-pending-count">
                {pendingCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground">awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-approved-count">
                {approvedCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground">requests approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium" data-testid="text-students-count">
              {studentsCount?.count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">assigned to your subjects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </div>
            <Link href="/staff/schedule">
              <Button variant="outline" size="sm" data-testid="button-view-schedule">
                View Full Schedule
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : todaySchedule && todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((cls, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`schedule-item-${index}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-medium">
                      P{cls.period}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cls.subjectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.subjectCode} • {cls.startTime} - {cls.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No classes scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Pending OD Requests</CardTitle>
              <CardDescription>Requests awaiting your approval</CardDescription>
            </div>
            <Link href="/staff/od-requests">
              <Button size="sm" data-testid="button-view-all-requests">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : odRequests && pendingCount > 0 ? (
              <div className="space-y-3">
                {odRequests
                  .filter((r) =>
                    r.staffApprovals.some((a) => a.staffId === user?.username && a.status === "pending")
                  )
                  .slice(0, 5)
                  .map((request, index) => (
                    <div
                      key={request._id || index}
                      className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                      data-testid={`request-item-${index}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{request.studentName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {request.dates.length === 1
                            ? new Date(request.dates[0]).toLocaleDateString()
                            : `${request.dates.length} days`}
                          {" • "}
                          {request.reason.slice(0, 50)}...
                        </p>
                      </div>
                      {getStatusBadge("pending")}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-3" />
                <p className="text-muted-foreground">No pending requests</p>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/staff/od-requests">
              <Button variant="outline" className="w-full h-auto py-4" data-testid="button-quick-od">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardCheck className="h-6 w-6" />
                  <span>Manage OD Requests</span>
                </div>
              </Button>
            </Link>
            <Link href="/staff/attendance">
              <Button variant="outline" className="w-full h-auto py-4" data-testid="button-quick-attendance">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Attendance</span>
                </div>
              </Button>
            </Link>
            <Link href="/staff/schedule">
              <Button variant="outline" className="w-full h-auto py-4" data-testid="button-quick-schedule">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>My Schedule</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
