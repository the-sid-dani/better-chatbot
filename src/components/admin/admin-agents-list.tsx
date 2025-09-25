"use client";

import { AdminAgentTableRow } from "@/types/admin";
import { AdminAgentsTable } from "./admin-agents-table";

interface Props {
  agents: AdminAgentTableRow[];
  userId: string;
}

export function AdminAgentsList({ agents, userId }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Agent Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage AI agents and their permissions across the platform.
        </p>
      </div>

      <AdminAgentsTable agents={agents} currentUserId={userId} />
    </div>
  );
}
