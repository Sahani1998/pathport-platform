"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

// Subscribes to Postgres changes on the student's applications and
// notifications and re-renders the server component tree when anything
// changes — live status updates without polling.
//
// Requires the tables to be in the supabase_realtime publication
// (sprint15_application_processing.sql, section 7).
export default function RealtimeRefresher({ userId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`student-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications", filter: `student_id=eq.${userId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
