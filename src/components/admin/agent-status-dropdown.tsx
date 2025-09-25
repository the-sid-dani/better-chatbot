"use client";

import { useState } from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "ui/dropdown-menu";
import { ChevronDown, Circle, Pause, Archive, FileEdit } from "lucide-react";
import { AgentStatus } from "src/types/agent";

interface AgentStatusDropdownProps {
  agentId: string;
  currentStatus: AgentStatus;
  onStatusChange?: (agentId: string, newStatus: AgentStatus) => Promise<void>;
  disabled?: boolean;
}

export function AgentStatusDropdown({
  agentId,
  currentStatus,
  onStatusChange,
  disabled = false,
}: AgentStatusDropdownProps) {
  const [localStatus, setLocalStatus] = useState<AgentStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (disabled || isUpdating) return;

    const statusValue = newStatus as AgentStatus;
    const prevStatus = localStatus;

    // Optimistic update
    setLocalStatus(statusValue);

    if (onStatusChange) {
      setIsUpdating(true);
      try {
        await onStatusChange(agentId, statusValue);
      } catch (error) {
        // Rollback on error
        setLocalStatus(prevStatus);
        console.error("Failed to update agent status:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusConfig = (status: AgentStatus) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          icon: Circle,
          variant: "default" as const,
          color: "text-green-600",
        };
      case "inactive":
        return {
          label: "Inactive",
          icon: Pause,
          variant: "secondary" as const,
          color: "text-gray-600",
        };
      case "archived":
        return {
          label: "Archived",
          icon: Archive,
          variant: "outline" as const,
          color: "text-orange-600",
        };
      case "draft":
        return {
          label: "Draft",
          icon: FileEdit,
          variant: "outline" as const,
          color: "text-blue-600",
        };
      default:
        return {
          label: "Unknown",
          icon: Circle,
          variant: "secondary" as const,
          color: "text-gray-600",
        };
    }
  };

  const currentConfig = getStatusConfig(localStatus);
  const IconComponent = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 justify-between"
          disabled={disabled || isUpdating}
        >
          <Badge
            variant={currentConfig.variant}
            className="border-0 bg-transparent px-0"
          >
            <IconComponent className={`size-3 mr-1 ${currentConfig.color}`} />
            <span className={currentConfig.color}>{currentConfig.label}</span>
          </Badge>
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Agent Status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={localStatus}
          onValueChange={handleStatusChange}
        >
          <DropdownMenuRadioItem value="active" disabled={isUpdating}>
            <Circle className="size-3 mr-2 text-green-600" />
            Active
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="inactive" disabled={isUpdating}>
            <Pause className="size-3 mr-2 text-gray-600" />
            Inactive
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="archived" disabled={isUpdating}>
            <Archive className="size-3 mr-2 text-orange-600" />
            Archived
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="draft" disabled={isUpdating}>
            <FileEdit className="size-3 mr-2 text-blue-600" />
            Draft
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
