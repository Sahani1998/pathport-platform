"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/timeline";
import { NOTIFICATION_TYPE_META } from "@/types/timeline";
import Link from "next/link";
import { CheckCheck, Loader2, AlertCircle } from "lucide-react";

interface NotificationListProps {
  notifications:  Notification[];
  onAllRead?:     () => void;
  // Base path for "View application →" deep links. Defaults to the student list.
  applicationBasePath?: string;
}

const API_TIMEOUT_MS = 15_000;

async function apiFetch(url: string, method: string): Promise<{ ok: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res  = await fetch(url, { method, signal: controller.signal });
    const json = await res.json() as { error?: string };
    return { ok: res.ok, error: json.error };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Request timed out. Please try again." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

export default function NotificationList({
  notifications: initial,
  onAllRead,
  applicationBasePath,
}: NotificationListProps) {
  const router = useRouter();
  const [items,      setItems]     = useState<Notification[]>(initial);
  const [marking,    setMarking]   = useState(false);
  const [markError,  setMarkError] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    const { ok, error } = await apiFetch(`/api/notifications/${id}/read`, "PATCH");
    if (ok) {
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      router.refresh();
    } else {
      console.error("[Notifications] mark-read failed:", error);
    }
  };

  const markAllRead = async () => {
    setMarking(true);
    setMarkError(null);

    const unreadIds = items.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length === 0) { setMarking(false); return; }

    const { ok, error } = await apiFetch("/api/notifications/mark-all-read", "POST");

    if (ok) {
      const now = new Date().toISOString();
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
      onAllRead?.();
      router.refresh();
    } else {
      setMarkError(error ?? "Failed to mark notifications as read. Please try again.");
    }
    setMarking(false);
  };

  const unreadCount = items.filter(n => !n.read_at).length;

  return (
    <div className="space-y-3">
      {/* Header row */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-white/40 font-body text-xs">{unreadCount} unread</span>
          <button
            onClick={markAllRead}
            disabled={marking}
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-body text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        </div>
      )}

      {markError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-400/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-xs">{markError}</p>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-white/20">
          <span className="text-4xl mb-3">🔔</span>
          <p className="font-body text-sm">No notifications yet</p>
        </div>
      )}

      {items.map(n => {
        const typeMeta = NOTIFICATION_TYPE_META[n.type];
        const isUnread = !n.read_at;
        return (
          <div
            key={n.id}
            onClick={() => { if (isUnread) markAsRead(n.id); }}
            className={`
              relative p-4 rounded-2xl border cursor-pointer transition-all
              ${isUnread
                ? "bg-white/[0.05] border-white/[0.12] hover:border-gold-400/30"
                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
              }
            `}
          >
            {/* Unread dot */}
            {isUnread && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold-400" />
            )}
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{typeMeta.emoji}</span>
              <div className="min-w-0 pr-4">
                <p className={`font-body font-semibold text-sm ${isUnread ? "text-white/90" : "text-white/55"}`}>
                  {n.title}
                </p>
                <p className="font-body text-xs text-white/40 mt-1 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-wider ${typeMeta.color}`}>
                    {typeMeta.label}
                  </span>
                  <span className="text-white/20 font-body text-[10px]">
                    {new Date(n.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {n.application_id && (
                  <Link
                    href={applicationBasePath ? `${applicationBasePath}/${n.application_id}` : "/dashboard/student/applications"}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-2 text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors"
                  >
                    View application →
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
