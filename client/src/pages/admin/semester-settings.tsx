import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, BookOpen, Trash2, Plus } from "lucide-react";

interface SubjectInput {
  subjectCode: string;
  subjectName: string;
  totalClasses: number | "";
}

export default function SemesterSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/semester-settings"],
    queryFn: async () => {
      const res = await fetch("/api/semester-settings");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const [semesterStart, setSemesterStart] = useState<string>("");
  const [semesterEnd, setSemesterEnd] = useState<string>("");
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { subjectCode: "", subjectName: "", totalClasses: "" },
  ]);

  useEffect(() => {
    if (data) {
      setSemesterStart(data.semesterStart?.substring(0, 10) || "");
      setSemesterEnd(data.semesterEnd?.substring(0, 10) || "");
      setSubjects(
        data.subjects && data.subjects.length
          ? data.subjects.map((sub: any) => ({
              subjectCode: sub.subjectCode,
              subjectName: sub.subjectName,
              totalClasses: sub.totalClasses,
            }))
          : [{ subjectCode: "", subjectName: "", totalClasses: "" }]
      );
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/semester-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/semester-settings"] });
      toast({
        title: "Settings Saved",
        description: "Semester settings have been updated successfully.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleAddSubject = () =>
    setSubjects([
      ...subjects,
      { subjectCode: "", subjectName: "", totalClasses: "" },
    ]);

  const handleRemoveSubject = (idx: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== idx));
    }
  };

  const handleSubjectChange = (
    idx: number,
    field: keyof SubjectInput,
    value: any
  ) => {
    const updated = [...subjects];
    updated[idx][field] = value;
    setSubjects(updated);
  };

  const handleSave = () => {
    const validSubjects = subjects.filter(
      (s) => s.subjectCode && s.subjectName && s.totalClasses
    );

    if (!semesterStart || !semesterEnd) {
      toast({
        title: "Validation Error",
        description: "Please set both semester start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (validSubjects.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one complete subject.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      semesterStart,
      semesterEnd,
      subjects: validSubjects,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Semester Settings</h1>
          <p className="text-muted-foreground">Configure semester dates and subjects</p>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Semester Settings</h1>
        <p className="text-muted-foreground">Configure semester dates and subjects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Semester Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Semester Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={semesterStart}
                onChange={(e) => setSemesterStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">Semester End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={semesterEnd}
                onChange={(e) => setSemesterEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subjects Configuration
            </CardTitle>
            <Badge variant="secondary">{subjects.length} subjects</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {subjects.map((sub, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-end p-4 rounded-md border bg-muted/30"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`subject-code-${idx}`} className="text-xs">
                    Subject Code
                  </Label>
                  <Input
                    id={`subject-code-${idx}`}
                    placeholder="e.g., CS101"
                    value={sub.subjectCode}
                    onChange={(e) =>
                      handleSubjectChange(idx, "subjectCode", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`subject-name-${idx}`} className="text-xs">
                    Subject Name
                  </Label>
                  <Input
                    id={`subject-name-${idx}`}
                    placeholder="e.g., Computer Science"
                    value={sub.subjectName}
                    onChange={(e) =>
                      handleSubjectChange(idx, "subjectName", e.target.value)
                    }
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor={`total-classes-${idx}`} className="text-xs">
                    Total Classes
                  </Label>
                  <Input
                    id={`total-classes-${idx}`}
                    placeholder="60"
                    type="number"
                    min={0}
                    value={sub.totalClasses}
                    onChange={(e) =>
                      handleSubjectChange(
                        idx,
                        "totalClasses",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSubject(idx)}
                  disabled={subjects.length === 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleAddSubject}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending} size="lg">
          {mutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}