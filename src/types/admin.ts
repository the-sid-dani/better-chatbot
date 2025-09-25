import { AgentStatus } from "./agent";

// Agent data interface for admin dashboard and management
// This is the unified interface that replaces all scattered AdminAgentTableRow definitions
export interface AdminAgentTableRow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  // Support all visibility types including readonly and public
  visibility:
    | "private"
    | "admin-all"
    | "admin-selective"
    | "readonly"
    | "public";
  // Support full AgentStatus enum from types/agent.ts
  status: AgentStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  // Permission-related fields for admin management
  permissionCount: number;
  permissions: Array<{
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    userImage?: string;
    permissionLevel: "use" | "edit";
  }>;
  // Optional bookmarking support
  isBookmarked?: boolean;
}

// User data interface for admin dashboard
export interface AdminUserTableRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Props interface for AdminUsersTable component
export interface AdminUsersTableProps {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  currentUserId: string; // Add the missing currentUserId prop
}

// Agent permission interface for dropdown component
export interface AgentPermission {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  permissionLevel: "use" | "edit";
}

// User interface for permission management
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "admin" | "user";
}

// Export types for consistency
export type AdminAgentVisibility = AdminAgentTableRow["visibility"];
export type AdminUserRole = AdminUserTableRow["role"];
export type PermissionLevel = AgentPermission["permissionLevel"];
