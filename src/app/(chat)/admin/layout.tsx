import { ReactNode } from "react";
import { requireAdmin } from "lib/auth/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout component for admin pages
 * Ensures admin authentication and provides admin navigation
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // This will redirect if user is not admin
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <div className="w-64 border-r bg-card">
          <AdminSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}