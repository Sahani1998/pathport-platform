"use client";

import Link from "next/link";
import { useAuth, useDashboardPath } from "@/context/AuthContext";
import GoldButton from "@/components/ui/GoldButton";
import { LayoutDashboard, LogOut, Loader2 } from "lucide-react";

export default function NavbarAuthButtons() {
  const { user, loading, signOut } = useAuth();
  const dashPath = useDashboardPath();

  if (loading) {
    return <Loader2 className="w-4 h-4 text-white/30 animate-spin" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href={dashPath}>
          <GoldButton variant="outline-gold" size="sm" className="gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </GoldButton>
        </Link>
        <GoldButton variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-3.5 h-3.5" />
        </GoldButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login">
        <GoldButton variant="outline-gold" size="sm">Sign In</GoldButton>
      </Link>
      <Link href="/signup">
        <GoldButton variant="solid-gold" size="sm">Register Free</GoldButton>
      </Link>
    </div>
  );
}
