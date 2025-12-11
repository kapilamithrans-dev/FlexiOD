import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, GraduationCap, User, Shield } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function ManageUsers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "staff":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "staff":
        return <Badge variant="default">Staff</Badge>;
      default:
        return <Badge variant="secondary">Student</Badge>;
    }
  };

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.rollNumber && user.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const students = filteredUsers?.filter((u) => u.role === "student") ?? [];
  const staff = filteredUsers?.filter((u) => u.role === "staff") ?? [];
  const admins = filteredUsers?.filter((u) => u.role === "admin") ?? [];

  const UserCard = ({ user }: { user: UserType }) => (
    <div
      className="flex items-center gap-4 p-4 rounded-md bg-muted/50"
      data-testid={`user-card-${user._id}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{user.name}</span>
          {getRoleBadge(user.role)}
        </div>
        <p className="text-sm text-muted-foreground">
          {user.email}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>@{user.username}</span>
          {user.rollNumber && (
            <>
              <span>•</span>
              <span>{user.rollNumber}</span>
            </>
          )}
          {user.department && (
            <>
              <span>•</span>
              <span>{user.department}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ role }: { role: string }) => (
    <div className="text-center py-12">
      {getRoleIcon(role)}
      <p className="text-muted-foreground mt-4">
        No {role}s found
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Manage Users
        </h1>
        <p className="text-muted-foreground">
          View all registered users in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            {users?.length ?? 0} users registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, username, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({filteredUsers?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="students" data-testid="tab-students">
                  Students ({students.length})
                </TabsTrigger>
                <TabsTrigger value="staff" data-testid="tab-staff">
                  Staff ({staff.length})
                </TabsTrigger>
                <TabsTrigger value="admins" data-testid="tab-admins">
                  Admins ({admins.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))
                    ) : (
                      <EmptyState role="user" />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="students">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {students.length > 0 ? (
                      students.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))
                    ) : (
                      <EmptyState role="student" />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="staff">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {staff.length > 0 ? (
                      staff.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))
                    ) : (
                      <EmptyState role="staff" />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="admins">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {admins.length > 0 ? (
                      admins.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))
                    ) : (
                      <EmptyState role="admin" />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
