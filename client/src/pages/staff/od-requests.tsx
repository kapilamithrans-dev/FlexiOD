import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Loader2,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { ODRequest } from "@shared/schema";

export default function StaffODRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: "approve" | "reject" | null }>({
    open: false,
    action: null,
  });

  const { data: odRequests, isLoading } = useQuery<ODRequest[]>({
    queryKey: ["/api/staff/od-requests", user?._id],
    enabled: !!user?._id,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, remarks }: { requestId: string; status: "approved" | "rejected"; remarks: string }) => {
      const response = await apiRequest("PATCH", `/api/od-requests/${requestId}/respond`, {
        staffId: user?._id,
        status,
        remarks,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "approved" ? "Request Approved" : "Request Rejected",
        description: `The OD request has been ${variables.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/od-requests"] });
      setActionDialog({ open: false, action: null });
      setSelectedRequest(null);
      setRemarks("");
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getMyApproval = (request: ODRequest) => {
    return request.staffApprovals.find((a) => a.staffId === user?._id);
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

  const filterByMyStatus = (status?: string) => {
    if (!odRequests) return [];
    if (!status || status === "all") return odRequests;
    return odRequests.filter((r) => {
      const myApproval = getMyApproval(r);
      return myApproval?.status === status;
    });
  };

  const pendingRequests = filterByMyStatus("pending");
  const approvedRequests = filterByMyStatus("approved");
  const rejectedRequests = filterByMyStatus("rejected");

  const handleAction = (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({
      requestId: selectedRequest._id!,
      status: action === "approve" ? "approved" : "rejected",
      remarks,
    });
  };

  const RequestCard = ({ request }: { request: ODRequest }) => {
    const myApproval = getMyApproval(request);
    const isPending = myApproval?.status === "pending";

    return (
      <Card className="hover-elevate">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                {request.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium" data-testid={`text-student-name-${request._id}`}>
                    {request.studentName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {request.studentRollNumber}
                  </Badge>
                  {getStatusBadge(myApproval?.status || "pending")}
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.dates.length === 1
                    ? format(new Date(request.dates[0]), "MMM d, yyyy")
                    : `${format(new Date(request.dates[0]), "MMM d")} - ${format(new Date(request.dates[request.dates.length - 1]), "MMM d, yyyy")}`}
                </p>
                <p className="text-sm text-muted-foreground truncate mt-1" data-testid={`text-reason-${request._id}`}>
                  {request.reason}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {request.dates.length} {request.dates.length === 1 ? "day" : "days"}
                  </span>
                  <span>
                    Submitted {format(new Date(request.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {request.proofPdfPath && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid={`button-view-proof-${request._id}`}
                >
                  <a href={request.proofPdfPath} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Proof
                  </a>
                </Button>
              )}
              {isPending ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionDialog({ open: true, action: "approve" });
                        }}
                        data-testid={`button-approve-${request._id}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionDialog({ open: true, action: "reject" });
                        }}
                        data-testid={`button-reject-${request._id}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                  data-testid={`button-view-${request._id}`}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
          OD Requests
        </h1>
        <p className="text-muted-foreground">
          Manage student OD requests for your subjects
        </p>
      </div>

      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" ? "Approve OD Request" : "Reject OD Request"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === "approve"
                ? "Confirm approval of this OD request"
                : "Provide a reason for rejecting this request"}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <p className="font-medium">{selectedRequest.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.dates.length === 1
                    ? format(new Date(selectedRequest.dates[0]), "MMMM d, yyyy")
                    : `${format(new Date(selectedRequest.dates[0]), "MMMM d")} - ${format(new Date(selectedRequest.dates[selectedRequest.dates.length - 1]), "MMMM d, yyyy")}`}
                </p>
              </div>
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder={actionDialog.action === "reject" ? "Reason for rejection..." : "Any comments..."}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-2"
                  data-testid="textarea-remarks"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, action: null });
                setRemarks("");
              }}
              data-testid="button-cancel-action"
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === "approve" ? "default" : "destructive"}
              onClick={() => handleAction(actionDialog.action!)}
              disabled={updateRequestMutation.isPending}
              data-testid="button-confirm-action"
            >
              {updateRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : odRequests && odRequests.length > 0 ? (
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({odRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))
            ) : (
              <EmptyState message="No pending requests. You're all caught up!" />
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

          <TabsContent value="all" className="space-y-4">
            {odRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No OD Requests</h3>
              <p className="text-muted-foreground">
                You don't have any OD requests to review at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
