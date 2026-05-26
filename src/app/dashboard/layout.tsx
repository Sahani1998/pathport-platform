import type { ReactNode } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // getUser() validates the JWT with Supabase — more secure than getSession().
  // If the access token is expired, Supabase silently uses the refresh token.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    // Read the current path from the x-pathname header stamped by middleware.
    // This lets us redirect to the right login page instead of always hitting
    // /login (which causes a redirect loop for admin paths).
    const headerList  = await headers();
    const pathname    = headerList.get("x-pathname") ?? "";
    const isAdminPath = pathname.startsWith("/dashboard/admin");

    if (isAdminPath) {
      redirect("/admin/login");   // Admin paths → admin login (no loop)
    }
    redirect("/login");           // All other dashboard paths → public login
  }

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
