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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [remarksPerSubject, setRemarksPerSubject] = useState<Record<string, string>>({});
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: "approve" | "reject" | null }>({
    open: false,
    action: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
    subjectCode: string | null;
  }>({
    open: false,
    action: null,
    subjectCode: null,
  });

  // Fetch semester settings (ONLY ONCE!)
  const { data: semesterSettings } = useQuery({
    queryKey: ["/api/semester-settings"],
    queryFn: async () => {
      const res = await fetch("/api/semester-settings");
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: odRequests, isLoading } = useQuery<ODRequest[]>({
    queryKey: ["/api/staff/od-requests", user?.username],
    enabled: !!user?.username,
  });

  // Single helper function to calculate OD usage
  const calculateODUsage = (studentId: string, subjectCode: string) => {
    if (!odRequests || !semesterSettings?.subjects) return { used: 0, total: 0, percentage: 0 };
    
    const subjectConfig = semesterSettings.subjects.find((s: any) => s.subjectCode === subjectCode);
    const totalClasses = subjectConfig?.totalClasses || 0;
    
    let usedDays = 0;
    odRequests.forEach(req => {
      if (req.studentId === studentId) {
        req.staffApprovals.forEach(appr => {
          if (appr.subjectCode === subjectCode && appr.status === "approved") {
            usedDays += req.dates.length;
          }
        });
      }
    });
    
    const percentage = totalClasses ? (usedDays / totalClasses) * 100 : 0;
    return { used: usedDays, total: totalClasses, percentage };
  };

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, remarks, subjectCode }: { requestId: string; status: "approved" | "rejected"; remarks: string; subjectCode?: string }) => {
      const response = await apiRequest("PATCH", `/api/od-requests/${requestId}/respond`, {
        staffId: user?.username,
        status,
        remarks,
        subjectCode,
      });
      return response.json();
    },
    onSuccess: (updatedRequest, variables) => {
      toast({
        title: variables.status === "approved" ? "Approved" : "Rejected",
        description: `${variables.subjectCode || 'Request'} ${variables.status}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff/od-requests"] });
      
      if (selectedRequest && updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
      
      if (variables.subjectCode) {
        setRemarksPerSubject(prev => {
          const newRemarks = { ...prev };
          delete newRemarks[variables.subjectCode!];
          return newRemarks;
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getMyApprovals = (request: ODRequest) => {
    if (!user?.username) return [];
    return request.staffApprovals.filter((a) => 
      a.staffId === user._id || 
      a.staffId === user.username ||
      a.staffId === user._id?.toString()
    );
  };

  const getMyApproval = (request: ODRequest) => {
    const approvals = getMyApprovals(request);
    return approvals[0];
  };

  const hasPendingApprovals = (request: ODRequest) => {
    const myApprovals = getMyApprovals(request);
    return myApprovals.some(a => a.status === "pending");
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

  const handleAction = (action: "approve" | "reject", subjectCode?: string) => {
    if (!selectedRequest || !subjectCode) return;
    
    setConfirmDialog({
      open: true,
      action,
      subjectCode,
    });
  };

  const confirmAction = () => {
    if (!selectedRequest || !confirmDialog.subjectCode) return;
    
    const remarks = remarksPerSubject[confirmDialog.subjectCode] || "";
    
    updateRequestMutation.mutate({
      requestId: selectedRequest._id!,
      status: confirmDialog.action === "approve" ? "approved" : "rejected",
      remarks,
      subjectCode: confirmDialog.subjectCode,
    });

    setConfirmDialog({ open: false, action: null, subjectCode: null });
  };

  const RequestCard = ({ request }: { request: ODRequest }) => {
    const myApprovals = getMyApprovals(request);
    const myApproval = myApprovals[0];
    const pendingApprovals = myApprovals.filter(a => a.status === "pending");
    const isPending = pendingApprovals.length > 0;
    const allComplete = myApprovals.length > 0 && myApprovals.every(a => a.status !== "pending");

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setRemarksPerSubject({});
                    setActionDialog({ open: true, action: null });
                  }}
                  data-testid={`button-manage-${request._id}`}
                >
                  Manage Approvals ({pendingApprovals.length})
                </Button>
              ) : allComplete ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionDialog({ open: true, action: null });
                  }}
                  data-testid={`button-view-${request._id}`}
                >
                  View
                </Button>
              ) : (
                <Dialog open={selectedRequest?._id === request._id} onOpenChange={() => setSelectedRequest(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>OD Request Details</DialogTitle>
                      <DialogDescription>
                        View complete details of this OD request
                      </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1">
                      <div className="space-y-4 p-1">
                        {selectedRequest && (
                          <>
                            <div className="p-4 rounded-md bg-muted/50 space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Student</Label>
                                <p className="font-medium">{selectedRequest.studentName}</p>
                                <p className="text-sm text-muted-foreground">{selectedRequest.studentRollNumber}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Dates</Label>
                                <p className="font-medium">
                                  {selectedRequest.dates.length === 1
                                    ? format(new Date(selectedRequest.dates[0]), "MMMM d, yyyy")
                                    : `${format(new Date(selectedRequest.dates[0]), "MMMM d")} - ${format(new Date(selectedRequest.dates[selectedRequest.dates.length - 1]), "MMMM d, yyyy")}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedRequest.dates.length} {selectedRequest.dates.length === 1 ? "day" : "days"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Reason</Label>
                                <p className="font-medium">{selectedRequest.reason}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Overall Status</Label>
                                <div className="mt-1">
                                  {getStatusBadge(selectedRequest.overallStatus)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Submitted</Label>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(selectedRequest.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Staff Approvals</Label>
                              <div className="space-y-2">
                                {selectedRequest.staffApprovals.map((approval, index) => {
                                  const isMyApproval = getMyApproval(selectedRequest) === approval;
                                  const util = semesterSettings ? calculateODUsage(selectedRequest.studentId, approval.subjectCode) : null;
                                  return (
                                    <div key={index} className={`p-3 rounded-md border ${isMyApproval ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{approval.staffName}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {approval.subjectCode} - {approval.subjectName}
                                          </p>
                                          {util && (
                                            <div className="mt-2 flex items-center gap-2">
                                              <span className="text-xs text-muted-foreground">
                                                OD: {util.used}/{util.total} days
                                              </span>
                                              <Badge 
                                                variant={util.percentage >= 25 ? "destructive" : util.percentage >= 13 ? "secondary" : "default"}
                                                className="text-xs"
                                              >
                                                {util.percentage.toFixed(1)}% 
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                        {getStatusBadge(approval.status)}
                                      </div>
                                      {approval.remarks && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                          <span className="font-medium">Remarks: </span>
                                          {approval.remarks}
                                        </p>
                                      )}
                                      {approval.respondedAt && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Responded: {format(new Date(approval.respondedAt), "MMM d, yyyy 'at' h:mm a")}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedRequest.proofPdfPath && (
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Proof Document</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={selectedRequest.proofPdfPath} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Proof Document
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </a>
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                    
                    <DialogFooter className="flex-shrink-0 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRequest(null)}
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-8 text-center text-muted-foreground">
      {message}
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({ open: false, action: null, subjectCode: null });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm {confirmDialog.action === "approve" ? "Approval" : "Rejection"}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to {confirmDialog.action} this request for {confirmDialog.subjectCode}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, action: null, subjectCode: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={updateRequestMutation.isPending}
            >
              {updateRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>Confirm {confirmDialog.action === "approve" ? "Approval" : "Rejection"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, action: null });
          setRemarksPerSubject({});
          setSelectedRequest(null);
        }
      }}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 min-h-[400px] pb-20">

              {/* Header */}
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Manage OD Request Approvals</DialogTitle>
                <DialogDescription>
                  Review and approve/reject each subject individually
                </DialogDescription>
              </DialogHeader>

              {selectedRequest && (
                <>
                  {/* Summary section */}
                  <div className="p-3 rounded-md bg-muted/50 shrink-0 mb-4">
                    <p className="font-medium">{selectedRequest.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.dates.length === 1
                        ? format(new Date(selectedRequest.dates[0]), "MMMM d, yyyy")
                        : `${format(new Date(selectedRequest.dates[0]), "MMMM d")} - ${format(new Date(selectedRequest.dates[selectedRequest.dates.length - 1]), "MMMM d, yyyy")}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRequest.reason}</p>
                  </div>

                  {/* Approvals section */}
                  <Label className="text-sm font-medium mb-3 block shrink-0">Your Approvals</Label>
                  <div className="space-y-3 pb-20">
                    {getMyApprovals(selectedRequest).map((approval, index) => (
                      <div
                        key={`${approval.subjectCode}-${approval.status}`}
                        className={`p-4 rounded-md border ${approval.status === "pending" ? 'border-yellow-500/20 bg-yellow-500/5' : approval.status === "approved" ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">{approval.subjectCode} - {approval.subjectName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {approval.staffName}
                            </p>
                            {semesterSettings && (
                              <div className="mt-2">
                                {(() => {
                                  const util = calculateODUsage(
                                    selectedRequest.studentId,
                                    approval.subjectCode
                                  );
                                  return (
                                    <div className="text-xs space-y-1">
                                      <span className="text-muted-foreground">
                                        OD Usage: {util.used} / {util.total} days
                                      </span>
                                      <div>
                                        <Badge 
                                          variant={util.percentage >= 25 ? "destructive" : util.percentage >= 13 ? "secondary" : "default"}
                                          className="text-xs"
                                        >
                                          {util.percentage.toFixed(1)}% utilized
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          {getStatusBadge(approval.status)}
                        </div>

                        {approval.status === "pending" ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`remarks-${approval.subjectCode}`} className="text-xs">Remarks (Optional)</Label>
                              <Textarea
                                id={`remarks-${approval.subjectCode}`}
                                placeholder="Any comments..."
                                value={remarksPerSubject[approval.subjectCode] || ""}
                                onChange={(e) => {
                                  setRemarksPerSubject(prev => ({
                                    ...prev,
                                    [approval.subjectCode]: e.target.value
                                  }));
                                }}
                                className="mt-1 text-sm"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 flex-1"
                                onClick={() => {
                                  handleAction("approve", approval.subjectCode);
                                }}
                                disabled={updateRequestMutation.isPending}
                              >
                                {updateRequestMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 flex-1"
                                onClick={() => {
                                  handleAction("reject", approval.subjectCode);
                                }}
                                disabled={updateRequestMutation.isPending}
                              >
                                {updateRequestMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {approval.remarks && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <span className="font-medium">Remarks: </span>
                                {approval.remarks}
                              </p>
                            )}
                            {approval.respondedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Responded: {format(new Date(approval.respondedAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Footer */}
              <DialogFooter className="flex-shrink-0 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionDialog({ open: false, action: null });
                    setRemarksPerSubject({});
                    setSelectedRequest(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
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
              <EmptyState message="No rejected requests yet" />
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