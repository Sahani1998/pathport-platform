import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationList from "@/components/notifications/NotificationList";
import type { Notification } from "@/types/timeline";
import { Bell } from "lucide-react";

export default async function StudentNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  console.log("[Notifications] loading for user:", user.id);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) console.error("[Notifications] fetch error:", error.message);

  const notifications = (data ?? []) as Notification[];
  const unreadCount   = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
            <Bell className="w-7 h-7 text-gold-400" />
            Notifications
          </h2>
          <p className="text-white/45 font-body text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* List */}
      <NotificationList notifications={notifications} />
    </div>
  );
}
