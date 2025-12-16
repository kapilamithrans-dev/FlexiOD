import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, Search, Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { AttendanceSummary, Subject } from "@shared/schema";

export default function StaffAttendance() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/staff/subjects", user?._id],
    enabled: !!user?._id,
  });

  const { data: attendanceData, isLoading } = useQuery<AttendanceSummary[]>({
    queryKey: ["staff-attendance", user?._id, selectedSubject],
    enabled: !!user?._id,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject && selectedSubject !== "all") {
        params.append("subjectCode", selectedSubject);
      }
      const url = `/api/staff/attendance/${user?._id}${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredData = attendanceData?.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || record.subjectCode === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const stats = {
    total: filteredData?.length ?? 0,
    above90: filteredData?.filter((r) => r.percentage >= 90).length ?? 0,
    between75And90: filteredData?.filter((r) => r.percentage >= 75 && r.percentage < 90).length ?? 0,
    below75: filteredData?.filter((r) => r.percentage < 75).length ?? 0,
    averageAttendance:
      filteredData && filteredData.length > 0
        ? Math.round(filteredData.reduce((acc, r) => acc + r.percentage, 0) / filteredData.length)
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Student Attendance
        </h1>
        <p className="text-muted-foreground">
          View attendance statistics for your students
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium" data-testid="text-total-students">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">in selected subject</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Above 90%</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-green-600" data-testid="text-above-90">
              {stats.above90}
            </div>
            <p className="text-xs text-muted-foreground">excellent attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Below 75%</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-red-600" data-testid="text-below-75">
              {stats.below75}
            </div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-medium ${getAttendanceColor(stats.averageAttendance)}`} data-testid="text-average">
              {stats.averageAttendance}%
            </div>
            <p className="text-xs text-muted-foreground">class average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Attendance List</CardTitle>
          <CardDescription>
            View individual student attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-student"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredData && filteredData.length > 0 ? (
            <div className="space-y-3">
              {filteredData.map((record, index) => (
                <div
                  key={`${record.studentId}-${record.subjectCode}`}
                  className="flex items-center gap-4 p-4 rounded-md bg-muted/50"
                  data-testid={`attendance-row-${index}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(record.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium" data-testid={`text-student-name-${index}`}>
                        {record.studentName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {record.studentRollNumber}
                      </Badge>
                      {selectedSubject === "all" && (
                        <Badge variant="secondary" className="text-xs">
                          {record.subjectCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex-1 max-w-xs">
                        <Progress
                          value={record.percentage}
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {record.attended}/{record.totalClasses} classes
                        {record.odCount > 0 && ` (+${record.odCount} OD)`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-medium ${getAttendanceColor(record.percentage)}`} data-testid={`text-percentage-${index}`}>
                      {record.percentage}%
                    </div>
                    {record.percentage < 75 && (
                      <span className="text-xs text-red-500 flex items-center gap-1 justify-end">
                        <AlertTriangle className="h-3 w-3" />
                        Low
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Records Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "No students match your search criteria."
                  : "No attendance records available for the selected subject."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
