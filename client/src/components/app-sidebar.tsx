import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  FileText,
  Upload,
  Users,
  ClipboardCheck,
  BarChart3,
  LogOut,
  GraduationCap,
  Home,
  Settings,
} from "lucide-react";

const studentMenuItems = [
  { title: "Dashboard", url: "/student", icon: Home },
  { title: "My Timetable", url: "/student/timetable", icon: Calendar },
  { title: "Submit OD Request", url: "/student/od-request", icon: FileText },
  { title: "My Requests", url: "/student/requests", icon: ClipboardCheck },
  { title: "OD Utilization", url: "/student/od-usage", icon: ClipboardCheck },
];

const staffMenuItems = [
  { title: "Dashboard", url: "/staff", icon: Home },
  { title: "My Schedule", url: "/staff/schedule", icon: Calendar },
  { title: "OD Requests", url: "/staff/od-requests", icon: ClipboardCheck },
  { title: "Attendance", url: "/staff/attendance", icon: BarChart3 },
];

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Upload Timetables", url: "/admin/upload-timetables", icon: Upload },
  { title: "Upload Mappings", url: "/admin/upload-mappings", icon: Users },
  { title: "Upload Staff Duty", url: "/admin/upload-duty", icon: Calendar },
  { title: "Manage Users", url: "/admin/users", icon: Settings },
  { title: "Semester Settings", url: "/admin/semester-settings", icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const getMenuItems = () => {
    switch (user.role) {
      case "admin":
        return adminMenuItems;
      case "staff":
        return staffMenuItems;
      default:
        return studentMenuItems;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (user.role) {
      case "admin":
        return "destructive";
      case "staff":
        return "default";
      default:
        return "secondary";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">OD Management</span>
            <span className="text-xs text-muted-foreground">Department Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user.name}
            </p>
            <Badge variant={getRoleBadgeVariant()} className="text-xs capitalize">
              {user.role}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
