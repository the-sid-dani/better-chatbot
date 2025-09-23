"use client";

import { Crown, Users, Bot, Workflow, Server, Home, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "lib/utils";
import { Button } from "ui/button";
import { Separator } from "ui/separator";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Admin overview",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage user roles",
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: Bot,
    description: "Admin-shared agents",
  },
  {
    title: "Workflows",
    href: "/admin/workflows",
    icon: Workflow,
    description: "Admin-shared workflows",
  },
  {
    title: "MCP Servers",
    href: "/admin/mcp-servers",
    icon: Server,
    description: "Global MCP servers",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Usage analytics",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Platform administration
        </p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-auto py-3",
                  isActive && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                )}
              >
                <item.icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Back to main app */}
      <div className="p-4">
        <Link href="/">
          <Button variant="outline" className="w-full justify-start gap-3">
            <Home className="w-4 h-4" />
            Back to Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}