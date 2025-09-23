"use client";

import { ReactNode, useEffect, useState } from "react";

interface ConditionalAdminUIProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders UI based on user role
 * Used to hide/show admin-specific features
 */
export function ConditionalAdminUI({
  children,
  requiredRole = "admin",
  fallback = null,
}: ConditionalAdminUIProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user role from the server
    const checkUserRole = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          // Assume the session API returns enhanced session with role
          setUserRole(data?.user?.role || "user");
        } else {
          setUserRole("user"); // Default to user if not authenticated
        }
      } catch (error) {
        console.error("Failed to check user role:", error);
        setUserRole("user"); // Default to user on error
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Check if user has required role
  const hasRequiredRole = userRole === requiredRole;

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Shorthand component for admin-only UI
 */
export function AdminOnlyUI({
  children,
  fallback,
}: Omit<ConditionalAdminUIProps, "requiredRole">) {
  return (
    <ConditionalAdminUI requiredRole="admin" fallback={fallback}>
      {children}
    </ConditionalAdminUI>
  );
}