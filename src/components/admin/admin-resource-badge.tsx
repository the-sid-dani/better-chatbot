"use client";

import { Crown } from "lucide-react";
import { Badge } from "ui/badge";

interface AdminResourceBadgeProps {
  visibility?: string;
  adminCreated?: boolean;
  className?: string;
}

/**
 * Badge component to indicate admin-shared resources
 * Shows when a resource has been shared by administrators
 */
export function AdminResourceBadge({
  visibility,
  adminCreated,
  className,
}: AdminResourceBadgeProps) {
  // Show badge for admin-shared visibility or admin-created resources
  const isAdminResource = visibility === "admin-shared" || adminCreated === true;

  if (!isAdminResource) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={`border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Admin Shared
    </Badge>
  );
}