import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Upload, X, Loader2, Info, User } from "lucide-react";
import { format } from "date-fns";
import type { TimetableEntry } from "@shared/schema";

const odFormSchema = z.object({
  dates: z.array(z.date()).min(1, "Select at least one date"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type ODFormData = z.infer<typeof odFormSchema>;

interface StaffForDate {
  staffId: string;
  staffName: string;
  subjectCode: string;
  subjectName: string;
}

export default function ODRequestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewStaff, setPreviewStaff] = useState<StaffForDate[]>([]);

  const form = useForm<ODFormData>({
    resolver: zodResolver(odFormSchema),
    defaultValues: {
      dates: [],
      reason: "",
    },
  });

  const { data: timetable } = useQuery<TimetableEntry[]>({
    queryKey: ["/api/timetable", user?.username],
    enabled: !!user?.username,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ODFormData) => {
      const formData = new FormData();
      formData.append("dates", JSON.stringify(data.dates.map((d) => format(d, "yyyy-MM-dd"))));
      formData.append("reason", data.reason);
      formData.append("studentId", user?.username || "");
      formData.append("studentName", user?.name || "");
      formData.append("studentRollNumber", user?.rollNumber || "");
      if (selectedFile) {
        formData.append("proof", selectedFile);
      }

      const response = await fetch("/api/od-requests", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your OD request has been sent to the relevant staff members.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/od-requests"] });
      setLocation("/student/requests");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDatesChange = (dates: Date[] | undefined) => {
    if (!dates || !timetable) {
      setPreviewStaff([]);
      return;
    }

    const staffSet = new Map<string, StaffForDate>();
    
    dates.forEach((date) => {
      const dayOfWeek = date.getDay();
      const dayClasses = timetable.filter((entry) => entry.dayOfWeek === dayOfWeek);
      
      dayClasses.forEach((entry) => {
        const key = `${entry.staffId}-${entry.subjectCode}`;
        if (!staffSet.has(key)) {
          staffSet.set(key, {
            staffId: entry.staffId,
            staffName: entry.staffName,
            subjectCode: entry.subjectCode,
            subjectName: entry.subjectName,
          });
        }
      });
    });

    setPreviewStaff(Array.from(staffSet.values()));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = (data: ODFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Submit OD Request
        </h1>
        <p className="text-muted-foreground">
          Request On-Duty leave for your scheduled classes
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select OD Dates
              </CardTitle>
              <CardDescription>
                Choose the dates for which you need On-Duty leave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col md:flex-row gap-6">
                        <Calendar
                          mode="multiple"
                          selected={field.value}
                          onSelect={(dates) => {
                            field.onChange(dates);
                            handleDatesChange(dates);
                          }}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                          data-testid="calendar-dates"
                        />
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">
                            Selected Dates
                          </Label>
                          {field.value.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((date, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="gap-1"
                                  data-testid={`badge-date-${index}`}
                                >
                                  {format(date, "MMM d, yyyy")}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDates = field.value.filter(
                                        (_, i) => i !== index
                                      );
                                      field.onChange(newDates);
                                      handleDatesChange(newDates);
                                    }}
                                    className="ml-1 hover:text-destructive"
                                    data-testid={`button-remove-date-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No dates selected yet. Click on the calendar to select dates.
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {previewStaff.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Staff to be Notified
                </CardTitle>
                <CardDescription>
                  Based on your selected dates, OD requests will be sent to these staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {previewStaff.map((staff, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                      data-testid={`staff-preview-${index}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {staff.staffName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{staff.staffName}</p>
                        <p className="text-xs text-muted-foreground">
                          {staff.subjectCode} - {staff.subjectName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Details
              </CardTitle>
              <CardDescription>
                Provide the reason and supporting documents for your OD request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for OD</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the reason for your On-Duty request (e.g., attending a workshop, competition, internship interview)"
                        className="min-h-24"
                        data-testid="textarea-reason"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 10 characters required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Proof Document (PDF)</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="proof-file"
                      data-testid="input-file-proof"
                    />
                    <Label
                      htmlFor="proof-file"
                      className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {selectedFile ? "Change File" : "Upload PDF"}
                      </span>
                    </Label>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate max-w-48" data-testid="text-filename">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        data-testid="button-remove-file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional: Upload supporting documents (max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              Once submitted, your request will be sent to all staff members whose classes fall on the selected dates. You'll be notified when they respond.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/student")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending || previewStaff.length === 0}
              data-testid="button-submit-request"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
