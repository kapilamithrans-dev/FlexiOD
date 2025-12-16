import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import type { StaffDutySchedule } from "@shared/schema";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StaffSchedule() {
  const { user } = useAuth();

  const { data: schedule, isLoading } = useQuery<StaffDutySchedule[]>({
    queryKey: ["/api/staff/schedule", user?.username],
    enabled: !!user?.username,
  });

  const getScheduleCell = (dayIndex: number, period: number) => {
    const entry = schedule?.find(
      (e) => e.dayOfWeek === dayIndex + 1 && e.period === period
    );
    return entry;
  };

  const getSubjectColor = (subjectCode: string) => {
    const colors = [
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
      "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    ];
    const hash = subjectCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          My Schedule
        </h1>
        <p className="text-muted-foreground">
          Your weekly duty schedule
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Duty Schedule
          </CardTitle>
          <CardDescription>
            Your teaching schedule for the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : schedule && schedule.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-muted-foreground border-b w-24">
                        Day
                      </th>
                      {PERIODS.map((period) => (
                        <th
                          key={period}
                          className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
                        >
                          Period {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, dayIndex) => (
                      <tr key={day} className="border-b last:border-0">
                        <td className="p-2 font-medium text-sm">{day}</td>
                        {PERIODS.map((period) => {
                          const entry = getScheduleCell(dayIndex, period);
                          return (
                            <td key={period} className="p-1">
                              {entry ? (
                                <div
                                  className={`p-2 rounded-md border ${getSubjectColor(entry.subjectCode)}`}
                                  data-testid={`cell-${day.toLowerCase()}-${period}`}
                                >
                                  <p className="font-medium text-sm truncate">
                                    {entry.subjectCode}
                                  </p>
                                  <p className="text-xs opacity-80 truncate">
                                    {entry.subjectName}
                                  </p>
                                  <p className="text-xs opacity-60">
                                    {entry.startTime}-{entry.endTime}
                                  </p>
                                </div>
                              ) : (
                                <div className="h-16 bg-muted/30 rounded-md" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Schedule Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your duty schedule hasn't been uploaded yet. Please contact your department administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {schedule && schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(new Set(schedule.map((e) => e.subjectCode))).map((code) => {
                const subject = schedule.find((e) => e.subjectCode === code);
                const classCount = schedule.filter((e) => e.subjectCode === code).length;
                return (
                  <div
                    key={code}
                    className={`p-4 rounded-md border ${getSubjectColor(code)}`}
                    data-testid={`summary-${code}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium">{code}</span>
                      <span className="text-sm opacity-80">{classCount} classes/week</span>
                    </div>
                    <p className="text-sm opacity-80">{subject?.subjectName}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
