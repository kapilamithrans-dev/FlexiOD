import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import StudentDashboard from "@/pages/student/dashboard";
import StudentTimetable from "@/pages/student/timetable";
import ODRequestPage from "@/pages/student/od-request";
import StudentRequests from "@/pages/student/requests";
import StaffDashboard from "@/pages/staff/dashboard";
import StaffSchedule from "@/pages/staff/schedule";
import StaffODRequests from "@/pages/staff/od-requests";
import StaffAttendance from "@/pages/staff/attendance";
import AdminDashboard from "@/pages/admin/dashboard";
import UploadTimetables from "@/pages/admin/upload-timetables";
import UploadMappings from "@/pages/admin/upload-mappings";
import UploadDuty from "@/pages/admin/upload-duty";
import ManageUsers from "@/pages/admin/users";

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "admin":
        return <Redirect to="/admin" />;
      case "staff":
        return <Redirect to="/staff" />;
      default:
        return <Redirect to="/student" />;
    }
  }

  return <>{children}</>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location !== "/login") {
    return <Redirect to="/login" />;
  }

  if (isAuthenticated && location === "/login") {
    switch (user?.role) {
      case "admin":
        return <Redirect to="/admin" />;
      case "staff":
        return <Redirect to="/staff" />;
      default:
        return <Redirect to="/student" />;
    }
  }

  if (isAuthenticated && location === "/") {
    switch (user?.role) {
      case "admin":
        return <Redirect to="/admin" />;
      case "staff":
        return <Redirect to="/staff" />;
      default:
        return <Redirect to="/student" />;
    }
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/student">
        <ProtectedRoute allowedRoles={["student"]}>
          <AuthenticatedLayout>
            <StudentDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/student/timetable">
        <ProtectedRoute allowedRoles={["student"]}>
          <AuthenticatedLayout>
            <StudentTimetable />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/student/od-request">
        <ProtectedRoute allowedRoles={["student"]}>
          <AuthenticatedLayout>
            <ODRequestPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/student/requests">
        <ProtectedRoute allowedRoles={["student"]}>
          <AuthenticatedLayout>
            <StudentRequests />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/staff">
        <ProtectedRoute allowedRoles={["staff"]}>
          <AuthenticatedLayout>
            <StaffDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff/schedule">
        <ProtectedRoute allowedRoles={["staff"]}>
          <AuthenticatedLayout>
            <StaffSchedule />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff/od-requests">
        <ProtectedRoute allowedRoles={["staff"]}>
          <AuthenticatedLayout>
            <StaffODRequests />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff/attendance">
        <ProtectedRoute allowedRoles={["staff"]}>
          <AuthenticatedLayout>
            <StaffAttendance />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <AdminDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/upload-timetables">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <UploadTimetables />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/upload-mappings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <UploadMappings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/upload-duty">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <UploadDuty />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <ManageUsers />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
