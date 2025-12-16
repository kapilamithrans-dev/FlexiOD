import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { Calendar, BookOpen, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper: Calculate a map of subjectCode => OD days
function getODCounts(requests: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const req of requests) {
    // Only count if overall request is approved or has at least one approved subject
    for (const appr of req.staffApprovals) {
      if (appr.status === "approved") {
        if (!out[appr.subjectCode]) out[appr.subjectCode] = 0;
        out[appr.subjectCode] += req.dates.length;
      }
    }
  }
  return out;
}

export default function StudentODUsage() {
  const { user } = useAuth();

  // 1. Fetch semester settings
  const { data: semester, isLoading: loadingSemester } = useQuery({
    queryKey: ["/api/semester-settings"],
    queryFn: async () => {
      const res = await fetch("/api/semester-settings");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch semester settings");
      return res.json();
    },
  });

  // 2. Fetch student's OD requests
  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ["/api/od-requests", user?.username],
    enabled: !!user?.username,
    queryFn: async () => {
      const res = await fetch(`/api/od-requests/${user?._id}`);
      if (!res.ok) throw new Error("Failed to fetch OD requests");
      return res.json();
    },
  });

  if (loadingSemester || loadingReqs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">OD Utilization</h1>
          <p className="text-muted-foreground">Track your OD usage across subjects</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!semester || !semester?.subjects?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">OD Utilization</h1>
          <p className="text-muted-foreground">Track your OD usage across subjects</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Semester settings have not been configured yet. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const odCountBySubject = getODCounts(requests || []);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 25) return "text-red-600 dark:text-red-400";
    if (percentage >= 13) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 25) return "bg-red-500";
    if (percentage >= 13) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">OD Utilization</h1>
        <p className="text-muted-foreground">Track your OD usage across subjects</p>
      </div>

      <div className="grid gap-4">
        {semester.subjects.map((sub: any) => {
          const used = odCountBySubject[sub.subjectCode] || 0;
          const total = sub.totalClasses || 0;
          const percentage = total ? (used / total) * 100 : 0;

          return (
            <Card key={sub.subjectCode} className="hover-elevate">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{sub.subjectName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {sub.subjectCode}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {used} of {total} days used
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getUsageColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">utilized</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress 
                      value={percentage}
                      className={`h-2 ${getProgressColor(percentage)}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{used} days</span>
                      <span>{total - used} days remaining</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {semester.subjects.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Subjects Found</h3>
              <p className="text-muted-foreground">
                No subjects have been configured for this semester.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}