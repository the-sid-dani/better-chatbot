"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { ArrowDownUp, Plus, Eye, Crown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Button } from "ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import Link from "next/link";
import { AgentPermissionDropdown } from "./agent-permission-dropdown";
import { AgentStatusDropdown } from "./agent-status-dropdown";
import { AgentStatus } from "@/types/agent";

// Agent data interface for table
interface AdminAgentTableRow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  visibility:
    | "private"
    | "admin-shared"
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

// Column configuration
interface Column {
  key: keyof AdminAgentTableRow | "actions" | "users";
  label: string;
  type?: "string" | "number" | "date" | "custom";
  sortable?: boolean;
}

const columns: Column[] = [
  { key: "name", label: "Name", type: "string", sortable: true },
  { key: "status", label: "Status", type: "string", sortable: true },
  { key: "description", label: "Description", type: "string", sortable: false },
  { key: "users", label: "Users", type: "custom", sortable: false },
  { key: "createdAt", label: "Created", type: "date", sortable: true },
  { key: "actions", label: "Actions", type: "custom", sortable: false },
];

// Sort direction type
type SortDirection = "asc" | "desc" | null;

interface AdminAgentsTableProps {
  agents: AdminAgentTableRow[];
  onPermissionsUpdate?: (
    agentId: string,
    userIds: string[],
    visibility: string,
  ) => Promise<void>;
  onStatusUpdate?: (agentId: string, newStatus: AgentStatus) => Promise<void>;
}

export function AdminAgentsTable({
  agents,
  onPermissionsUpdate,
  onStatusUpdate,
}: AdminAgentsTableProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key)),
  );

  // Helper function to format cell values
  const formatCellValue = (value: any, columnType: string = "string") => {
    if (value === null || value === undefined) return "";

    switch (columnType) {
      case "date":
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      default:
        return String(value);
    }
  };

  // Helper function to get agent initials for avatar
  const getAgentInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...agents];

    // Apply global search
    if (searchTerm) {
      filtered = filtered.filter((agent) =>
        Object.values(agent).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof AdminAgentTableRow];
        const bValue = b[sortColumn as keyof AdminAgentTableRow];

        let comparison = 0;

        if (sortColumn === "createdAt") {
          comparison =
            new Date(aValue as Date).getTime() -
            new Date(bValue as Date).getTime();
        } else {
          comparison = String(aValue || "").localeCompare(String(bValue || ""));
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [agents, searchTerm, sortColumn, sortDirection]);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
            ? null
            : "asc",
      );
      if (sortDirection === "desc") {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const visibleColumnsArray = columns.filter((col) =>
    visibleColumns.has(col.key),
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-5 text-primary" />
              Admin Agents ({agents.length})
            </CardTitle>
            <Button asChild>
              <Link href="/agents">
                <Plus className="size-4 mr-2" />
                Create Agent
              </Link>
            </Button>
          </div>

          {/* Search and Column Visibility */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name, description, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="data-[state=open]:bg-accent">
                  <Eye className="size-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.has(column.key)}
                    onCheckedChange={(checked) => {
                      const newVisible = new Set(visibleColumns);
                      if (checked) {
                        newVisible.add(column.key);
                      } else {
                        newVisible.delete(column.key);
                      }
                      setVisibleColumns(newVisible);
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-secondary border-t">
            <TableRow>
              {visibleColumnsArray.map((column, index) => (
                <TableHead
                  key={column.key}
                  className={`relative select-none ${
                    index === 0
                      ? "pl-6"
                      : index === visibleColumnsArray.length - 1
                        ? "pr-6"
                        : ""
                  } ${
                    column.type === "number" || column.type === "date"
                      ? "text-center"
                      : ""
                  }`}
                >
                  {column.sortable ? (
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:text-primary"
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <ArrowDownUp
                        className={`h-3 w-3 ${
                          sortColumn === column.key
                            ? ""
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </div>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsArray.length}
                  className="text-center h-48"
                >
                  {searchTerm
                    ? "No agents found matching your search"
                    : "No agents found"}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((agent) => (
                <TableRow key={agent.id}>
                  {visibleColumnsArray.map((column, index) => (
                    <TableCell
                      key={column.key}
                      className={`py-3 ${
                        index === 0
                          ? "pl-6"
                          : index === visibleColumnsArray.length - 1
                            ? "pr-6"
                            : ""
                      } ${
                        column.type === "number" || column.type === "date"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {column.key === "name" ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={agent.icon} alt={agent.name} />
                            <AvatarFallback>
                              {getAgentInitials(agent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                          </div>
                        </div>
                      ) : column.key === "status" ? (
                        <AgentStatusDropdown
                          agentId={agent.id}
                          currentStatus={agent.status}
                          onStatusChange={onStatusUpdate}
                        />
                      ) : column.key === "description" ? (
                        <span className="text-sm text-muted-foreground max-w-xs truncate">
                          {agent.description || "No description"}
                        </span>
                      ) : column.key === "users" ? (
                        <AgentPermissionDropdown
                          agent={agent}
                          onUpdate={
                            onPermissionsUpdate
                              ? (userIds, visibility) =>
                                  onPermissionsUpdate(
                                    agent.id,
                                    userIds,
                                    visibility,
                                  )
                              : undefined
                          }
                        />
                      ) : column.key === "actions" ? (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/agent/${agent.id}`}>View</Link>
                          </Button>
                        </div>
                      ) : column.key === "createdAt" ? (
                        formatCellValue(agent.createdAt, "date")
                      ) : (
                        formatCellValue(
                          agent[column.key as keyof AdminAgentTableRow],
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Summary */}
        <div className="flex items-center justify-between pt-4 px-6">
          <div className="text-xs text-muted-foreground">
            Showing {processedData.length} of {agents.length} agents
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
