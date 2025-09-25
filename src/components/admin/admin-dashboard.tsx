"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Crown, Settings, Users } from "lucide-react";
import { BackgroundPaths } from "ui/background-paths";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "ui/tabs";
import { AdminAgentsTable } from "./admin-agents-table";
import { AdminUsersTable } from "./admin-users-table";
import { AgentStatus } from "@/types/agent";

// Agent data interface for admin dashboard
interface AdminAgentTableRow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  visibility:
    | "private"
    | "admin-all"
    | "admin-selective"
    | "admin-all"
    | "readonly"
    | "public";
  status: AgentStatus;
  createdAt: Date;
  permissionCount: number;
  permissions: Array<{
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    userImage?: string;
    permissionLevel: "use" | "edit";
  }>;
}

// User data interface for admin dashboard
interface AdminUserTableRow {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "admin" | "user";
  createdAt: Date;
}

interface AdminDashboardProps {
  adminAgents: AdminAgentTableRow[];
  allUsers: AdminUserTableRow[];
  totalUsers: number;
  adminUsers: number;
}

export function AdminDashboard({
  adminAgents,
  allUsers,
  totalUsers,
  adminUsers,
}: AdminDashboardProps) {
  const handlePermissionsUpdate = async (
    agentId: string,
    userIds: string[],
    visibility: string,
  ) => {
    try {
      const response = await fetch("/api/admin/agent-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          userIds,
          visibility,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update permissions: ${response.statusText}`);
      }

      // Optionally refresh the page or update local state
      // For now, we'll rely on optimistic updates in the dropdown component
    } catch (error) {
      console.error("Error updating agent permissions:", error);
      throw error; // Re-throw to allow the dropdown component to handle rollback
    }
  };

  const handleStatusUpdate = async (
    agentId: string,
    newStatus: AgentStatus,
  ) => {
    try {
      const response = await fetch(`/api/agent/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update agent status: ${response.statusText}`,
        );
      }

      // Optionally refresh the page or update local state
      // For now, we'll rely on optimistic updates in the dropdown component
    } catch (error) {
      console.error("Error updating agent status:", error);
      throw error; // Re-throw to allow the dropdown component to handle rollback
    }
  };

  const handleUserRoleUpdate = async (
    userId: string,
    newRole: "admin" | "user",
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user role: ${response.statusText}`);
      }

      // Optionally refresh the page or update local state
      // For now, we'll rely on optimistic updates in the dropdown component
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error; // Re-throw to allow the dropdown component to handle rollback
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <Crown className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage shared agents and user access for the platform
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="@container relative overflow-hidden">
          <BackgroundPaths className="opacity-20" pathCount={3} />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Admin Agents</CardTitle>
                <CardDescription>
                  Shared with all platform users
                </CardDescription>
              </div>
              <div className="flex items-center justify-center size-10 rounded-lg bg-blue-500/10">
                <Crown className="size-5 text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold">{adminAgents.length}</div>
          </CardHeader>
        </Card>

        <Card className="@container relative overflow-hidden">
          <BackgroundPaths className="opacity-20" pathCount={3} />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Platform Users</CardTitle>
                <CardDescription>Total registered users</CardDescription>
              </div>
              <div className="flex items-center justify-center size-10 rounded-lg bg-green-500/10">
                <Users className="size-5 text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardHeader>
        </Card>

        <Card className="@container relative overflow-hidden">
          <BackgroundPaths className="opacity-20" pathCount={3} />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Administrators</CardTitle>
                <CardDescription>Users with admin access</CardDescription>
              </div>
              <div className="flex items-center justify-center size-10 rounded-lg bg-purple-500/10">
                <Settings className="size-5 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold">{adminUsers}</div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Crown className="size-4" />
            Agents ({adminAgents.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="size-4" />
            Users ({totalUsers})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <AdminAgentsTable
            agents={adminAgents}
            onPermissionsUpdate={handlePermissionsUpdate}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUsersTable
            users={allUsers}
            onRoleUpdate={handleUserRoleUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
