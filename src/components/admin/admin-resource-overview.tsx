"use client";

import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Bot, Workflow, Server, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "ui/badge";
import { format } from "date-fns";
import { AgentSummary } from "app-types/agent";
import { WorkflowSummary } from "app-types/workflow";
import { McpServerSelect } from "app-types/mcp";

interface AdminResourceOverviewProps {
  recentAgents: AgentSummary[];
  recentWorkflows: WorkflowSummary[];
  recentMcpServers: McpServerSelect[];
}

export function AdminResourceOverview({
  recentAgents,
  recentWorkflows,
  recentMcpServers,
}: AdminResourceOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Admin Agents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Admin Agents
          </CardTitle>
          <Link href="/admin/agents">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin agents yet. Create one to get started.
            </p>
          ) : (
            <>
              {recentAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(agent.updatedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Shared
                  </Badge>
                </div>
              ))}
              {recentAgents.length >= 5 && (
                <Link href="/admin/agents">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Workflows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Admin Workflows
          </CardTitle>
          <Link href="/admin/workflows">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentWorkflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin workflows yet. Create one to get started.
            </p>
          ) : (
            <>
              {recentWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{workflow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(workflow.updatedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={workflow.isPublished ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {workflow.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
              {recentWorkflows.length >= 5 && (
                <Link href="/admin/workflows">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin MCP Servers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            MCP Servers
          </CardTitle>
          <Link href="/admin/mcp-servers">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentMcpServers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin MCP servers yet. Add one to get started.
            </p>
          ) : (
            <>
              {recentMcpServers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{server.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(server.updatedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={server.enabled ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {server.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              ))}
              {recentMcpServers.length >= 5 && (
                <Link href="/admin/mcp-servers">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}