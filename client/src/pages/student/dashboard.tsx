import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ODRequest, TimetableEntry } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: odRequests, isLoading: loadingRequests } = useQuery<ODRequest[]>({
    queryKey: ["/api/od-requests", user?._id],
    enabled: !!user?._id,
  });

  const { data: todayClasses, isLoading: loadingClasses } = useQuery<TimetableEntry[]>({
    queryKey: ["/api/timetable/today", user?._id],
    enabled: !!user?._id,
  });

  const pendingCount = odRequests?.filter((r) => r.overallStatus === "pending").length ?? 0;
  const approvedCount = odRequests?.filter((r) => r.overallStatus === "approved").length ?? 0;
  const rejectedCount = odRequests?.filter((r) => r.overallStatus === "rejected").length ?? 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

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
          Here's an overview of your timetable and OD requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-today-classes">
                {todayClasses?.length ?? 0}
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
            <p className="text-xs text-muted-foreground">awaiting approval</p>
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
            <p className="text-xs text-muted-foreground">OD requests approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-medium" data-testid="text-rejected-count">
                {rejectedCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground">OD requests rejected</p>
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
            <Link href="/student/timetable">
              <Button variant="outline" size="sm" data-testid="button-view-timetable">
                View Full Timetable
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : todayClasses && todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`class-item-${index}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-medium">
                      P{cls.period}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cls.subjectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.staffName} • {cls.startTime} - {cls.endTime}
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
              <CardTitle className="text-lg">Recent OD Requests</CardTitle>
              <CardDescription>Your latest OD submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/student/od-request">
                <Button size="sm" data-testid="button-new-od-request">
                  <FileText className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : odRequests && odRequests.length > 0 ? (
              <div className="space-y-3">
                {odRequests.slice(0, 5).map((request, index) => (
                  <div
                    key={request._id || index}
                    className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`request-item-${index}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      {getStatusIcon(request.overallStatus)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {request.dates.length === 1
                          ? new Date(request.dates[0]).toLocaleDateString()
                          : `${new Date(request.dates[0]).toLocaleDateString()} - ${new Date(request.dates[request.dates.length - 1]).toLocaleDateString()}`}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.reason}
                      </p>
                    </div>
                    {getStatusBadge(request.overallStatus)}
                  </div>
                ))}
                {odRequests.length > 5 && (
                  <Link href="/student/requests">
                    <Button variant="ghost" className="w-full" data-testid="button-view-all-requests">
                      View all {odRequests.length} requests
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No OD requests yet</p>
                <Link href="/student/od-request">
                  <Button data-testid="button-submit-first-request">
                    Submit your first request
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
