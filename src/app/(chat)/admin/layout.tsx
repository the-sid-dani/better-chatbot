import { getEnhancedSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Crown, BarChart3, Bot, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  return (
    <Button variant="ghost" asChild className="w-full justify-start">
      <Link href={href}>
        <Icon className="w-4 h-4 mr-2" />
        {children}
      </Link>
    </Button>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="admin-layout min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Samba Admin</h1>
              <p className="text-sm text-slate-600">
                Agent Platform Management
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {session.user.email} • Admin
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-2">
            <NavLink href="/admin" icon={BarChart3}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/agents" icon={Bot}>
              Admin Agents
            </NavLink>
            <NavLink href="/admin/users" icon={Users}>
              User Management
            </NavLink>
            <div className="pt-4 mt-4 border-t border-slate-200">
              <NavLink href="/" icon={Bot}>
                Back to Chat
              </NavLink>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
