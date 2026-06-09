import type { ReactNode } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  console.log("[DashboardLayout] session check — start");

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log("[DashboardLayout] getUser result — user:", user ? user.id : "null", "| error:", error?.message ?? "none");

  const headerList  = await headers();
  const pathname    = headerList.get("x-pathname") ?? "";
  const isAdminPath = pathname.startsWith("/dashboard/admin");

  if (!user || error) {
    console.log(
      "[DashboardLayout] REDIRECT →", isAdminPath ? "/admin/login" : "/login",
      "| x-pathname:", pathname,
      "| reason:", error?.message ?? "user null"
    );
    if (isAdminPath) redirect("/admin/login");
    redirect("/login");
  }

  // Enforce email verification for non-admin users.
  // Admins are exempt so manually-created admin accounts always work.
  if (!user.email_confirmed_at && !isAdminPath) {
    redirect("/verify-email");
  }

  console.log("[DashboardLayout] session OK — rendering layout");

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
