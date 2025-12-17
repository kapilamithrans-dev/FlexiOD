import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { ODRequest, StaffApproval } from "@shared/schema";

export default function StudentRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);

  const { data: odRequests, isLoading } = useQuery<ODRequest[]>({
    queryKey: ["/api/od-requests", user?.username],
    enabled: !!user?.username,
     refetchOnWindowFocus: true,
  refetchInterval: 15_000, 
    queryFn: async () => {
      const res = await fetch(
        `https://flexiod.onrender.com/api/od-requests/${user?.username}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch staff schedule");
      }

      return res.json();
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(
          `/api/od-requests/${requestId}/report`,
          { credentials: "include" }
        );
      if (!response.ok) throw new Error("Failed to generate report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OD_Report_${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Report Downloaded",
        description: "Your OD report has been downloaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Could not generate the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
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

  const getApprovalStatusBadge = (approval: StaffApproval) => {
    switch (approval.status) {
      case "approved":
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">Pending</span>
          </div>
        );
    }
  };

  const filterByStatus = (status?: string) => {
    if (!odRequests) return [];
    if (!status || status === "all") return odRequests;
    return odRequests.filter((r) => r.overallStatus === status);
  };

  const pendingRequests = filterByStatus("pending");
  const approvedRequests = filterByStatus("approved");
  const rejectedRequests = filterByStatus("rejected");

  const RequestCard = ({ request }: { request: ODRequest }) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
              {getStatusIcon(request.overallStatus)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium" data-testid={`text-request-dates-${request._id}`}>
                  {request.dates.length === 1
                    ? format(new Date(request.dates[0]), "MMM d, yyyy")
                    : `${format(new Date(request.dates[0]), "MMM d")} - ${format(new Date(request.dates[request.dates.length - 1]), "MMM d, yyyy")}`}
                </span>
                {getStatusBadge(request.overallStatus)}
              </div>
              <p className="text-sm text-muted-foreground truncate" data-testid={`text-request-reason-${request._id}`}>
                {request.reason}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {request.dates.length} {request.dates.length === 1 ? "day" : "days"}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {request.staffApprovals.length} staff
                </span>
                <span>
                  Submitted {format(new Date(request.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                  data-testid={`button-view-details-${request._id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
              <ScrollArea className="flex-1">
                <DialogHeader>
                  <DialogTitle>OD Request Details</DialogTitle>
                  <DialogDescription>
                    View the status of your OD request
                  </DialogDescription>
                </DialogHeader>
                {selectedRequest && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">
                          {selectedRequest.dates.length === 1
                            ? format(new Date(selectedRequest.dates[0]), "MMMM d, yyyy")
                            : `${format(new Date(selectedRequest.dates[0]), "MMMM d")} - ${format(new Date(selectedRequest.dates[selectedRequest.dates.length - 1]), "MMMM d, yyyy")}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRequest.dates.length} {selectedRequest.dates.length === 1 ? "day" : "days"}
                        </p>
                      </div>
                      {getStatusBadge(selectedRequest.overallStatus)}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Reason</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedRequest.reason}
                      </p>
                    </div>

                    {selectedRequest.proofPdfPath && (
                      <div>
                        <Label className="text-sm font-medium">Proof Document</Label>
                        <a
                          href={selectedRequest.proofPdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 mt-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View uploaded document
                        </a>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Staff Approvals
                      </Label>
                      <ScrollArea className="max-h-60">
                        <div className="space-y-3">
                          {selectedRequest.staffApprovals.map((approval, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-sm">{approval.staffName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {approval.subjectCode} - {approval.subjectName}
                                </p>
                                {approval.remarks && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{approval.remarks}"
                                  </p>
                                )}
                              </div>
                              {getApprovalStatusBadge(approval)}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </ScrollArea>
              </DialogContent>
            </Dialog>
            {(
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReportMutation.mutate(request._id!)}
                disabled={downloadReportMutation.isPending}
                data-testid={`button-download-report-${request._id}`}
              >
                {downloadReportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          My OD Requests
        </h1>
        <p className="text-muted-foreground">
          Track the status of your OD requests
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : odRequests && odRequests.length > 0 ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({odRequests.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {odRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))
            ) : (
              <EmptyState message="No pending requests" />
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRequests.length > 0 ? (
              approvedRequests.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))
            ) : (
              <EmptyState message="No approved requests yet" />
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length > 0 ? (
              rejectedRequests.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))
            ) : (
              <EmptyState message="No rejected requests" />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No OD Requests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first OD request to get started
              </p>
              <Button asChild data-testid="button-submit-first-request">
                <a href="/student/od-request">Submit Request</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className}>{children}</p>;
}
