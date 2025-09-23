"use client";

import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Bot, Server, Users, Workflow, Crown } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  adminAgents: number;
  adminWorkflows: number;
  adminMcpServers: number;
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: `${stats.adminUsers} admin users`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Admin Agents",
      value: stats.adminAgents,
      description: "Shared with all users",
      icon: Bot,
      color: "text-green-600",
    },
    {
      title: "Admin Workflows",
      value: stats.adminWorkflows,
      description: "Available globally",
      icon: Workflow,
      color: "text-purple-600",
    },
    {
      title: "Admin MCP Servers",
      value: stats.adminMcpServers,
      description: "Global tool servers",
      icon: Server,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}