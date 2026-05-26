"use client";

import { useAuth } from "@/context/AuthContext";
import { Bell, Search } from "lucide-react";
import type { UserRole } from "@/types/auth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/student":     "Student Dashboard",
  "/dashboard/admin":       "Admin Dashboard",
  "/dashboard/institution": "Institution Dashboard",
  "/dashboard/partner":     "Partner Dashboard",
  "/dashboard/employer":    "Employer Dashboard",
};

const ROLE_COLOURS: Record<UserRole, string> = {
  student:             "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30",
  admin:               "bg-gold-400/15 text-gold-400 border-gold-400/30",
  institution:         "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30",
  recruitment_partner: "bg-gold-400/15 text-gold-400 border-gold-400/30",
  employer:            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { profile } = useAuth();
  const role        = profile?.role ?? "student";

  return (
    <header className="h-16 border-b border-white/[0.07] bg-navy-900/80 backdrop-blur-md flex items-center justify-between px-6 gap-4 flex-shrink-0">
      {/* Title */}
      <h1 className="font-display text-xl text-white/90 leading-none">
        {title ?? "Dashboard"}
      </h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 w-52">
          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent text-white/70 placeholder-white/25 font-body text-sm flex-1 min-w-0 focus:outline-none"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
          <Bell className="w-4 h-4" />
          {/* Dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold-400" />
        </button>

        {/* Role badge + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-navy-900 font-display font-bold text-sm flex-shrink-0">
            {(profile?.full_name ?? "U")[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-white/80 font-body text-xs font-semibold leading-tight">
              {profile?.full_name ?? "User"}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold tracking-wider uppercase ${ROLE_COLOURS[role]}`}>
              {role.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
