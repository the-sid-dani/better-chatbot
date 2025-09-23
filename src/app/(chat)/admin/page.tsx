import { getEnhancedSession } from "lib/auth/server";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Bot, Server, Users, Workflow, Crown } from "lucide-react";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";
import { AdminResourceOverview } from "@/components/admin/admin-resource-overview";

export default async function AdminDashboard() {
  const session = await getEnhancedSession();

  if (!session || session.user.role !== "admin") {
    // This should be caught by middleware, but just in case
    throw new Error("Unauthorized");
  }

  // Fetch admin resource stats
  const [allAgents, allWorkflows, allMcpServers, allUsers] = await Promise.all([
    pgAgentRepository.selectAgents(session.user.id, ["all"], 1000),
    pgWorkflowRepository.selectAll(session.user.id),
    pgMcpRepository.selectAll(),
    pgUserRepository.listUsers(),
  ]);

  // Filter for admin-created resources
  const adminAgents = allAgents.filter(agent => agent.visibility === "admin-shared");
  const adminWorkflows = allWorkflows.filter(workflow => workflow.visibility === "admin-shared");
  const adminMcpServers = allMcpServers.filter(server => server.adminCreated === true);
  const adminUsers = allUsers.filter(user => user.role === "admin");

  const stats = {
    totalUsers: allUsers.length,
    adminUsers: adminUsers.length,
    adminAgents: adminAgents.length,
    adminWorkflows: adminWorkflows.length,
    adminMcpServers: adminMcpServers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage platform resources and monitor usage across the system.
        </p>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Resource Overview */}
      <AdminResourceOverview
        recentAgents={adminAgents.slice(0, 5)}
        recentWorkflows={adminWorkflows.slice(0, 5)}
        recentMcpServers={adminMcpServers.slice(0, 5)}
      />
    </div>
  );
}