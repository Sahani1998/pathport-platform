import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationList from "@/components/notifications/NotificationList";
import type { Notification } from "@/types/timeline";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployerNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") redirect("/dashboard");

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as Notification[];
  const unreadCount   = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
            <Bell className="w-7 h-7 text-emerald-400" />
            Notifications
          </h2>
          <p className="text-white/45 font-body text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-xs font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
