"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import {
  LayoutDashboard, FileText, BookOpen, Briefcase, Building2,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
  GraduationCap, BarChart2, UserCircle, ClipboardList,
  Globe, Award, MessageSquare,
} from "lucide-react";

// ─── Role-specific nav items ──────────────────────────────────────────────────

const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  student: [
    { label: "Dashboard",        href: "/dashboard/student",              icon: LayoutDashboard },
    { label: "My Applications",  href: "/dashboard/student/applications", icon: FileText        },
    { label: "Course Browser",   href: "/dashboard/student/courses",      icon: BookOpen        },
    { label: "Internships",      href: "/dashboard/student/internships",  icon: Briefcase       },
    { label: "My Documents",     href: "/dashboard/student/documents",    icon: ClipboardList   },
    { label: "Arrival Services", href: "/dashboard/student/arrival",      icon: Globe           },
    { label: "Profile",          href: "/dashboard/student/profile",      icon: UserCircle      },
  ],
  admin: [
    { label: "Dashboard",        href: "/dashboard/admin",                icon: LayoutDashboard },
    { label: "Inquiries",        href: "/dashboard/admin/inquiries",      icon: MessageSquare   },
    { label: "All Students",     href: "/dashboard/admin/students",       icon: Users           },
    { label: "Applications",     href: "/dashboard/admin/applications",   icon: FileText        },
    { label: "Colleges",         href: "/dashboard/admin/colleges",       icon: Building2       },
    { label: "Partners",         href: "/dashboard/admin/partners",       icon: Award           },
    { label: "Analytics",        href: "/dashboard/admin/analytics",      icon: BarChart2       },
    { label: "Settings",         href: "/dashboard/admin/settings",       icon: Settings        },
  ],
  institution: [
    { label: "Dashboard",        href: "/dashboard/institution",            icon: LayoutDashboard },
    { label: "Students",         href: "/dashboard/institution/students",   icon: GraduationCap   },
    { label: "Applications",     href: "/dashboard/institution/applications",icon: FileText       },
    { label: "Courses",          href: "/dashboard/institution/courses",    icon: BookOpen        },
    { label: "Reports",          href: "/dashboard/institution/reports",    icon: BarChart2       },
  ],
  recruitment_partner: [
    { label: "Dashboard",        href: "/dashboard/partner",              icon: LayoutDashboard },
    { label: "Candidates",       href: "/dashboard/partner/candidates",   icon: Users           },
    { label: "Placements",       href: "/dashboard/partner/placements",   icon: Briefcase       },
    { label: "Reports",          href: "/dashboard/partner/reports",      icon: BarChart2       },
  ],
  employer: [
    { label: "Dashboard",        href: "/dashboard/employer",             icon: LayoutDashboard },
    { label: "Intern Requests",  href: "/dashboard/employer/requests",    icon: ClipboardList   },
    { label: "Current Interns",  href: "/dashboard/employer/interns",     icon: Users           },
    { label: "Reports",          href: "/dashboard/employer/reports",     icon: BarChart2       },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  student:             "Student",
  admin:               "Admin",
  institution:         "Institution",
  recruitment_partner: "Recruitment Partner",
  employer:            "Employer",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Derive role with three priority levels:
  // 1. profile.role from Supabase (authoritative, once loaded)
  // 2. pathname inference (instant, matches what the server already verified)
  // 3. "student" only if we're genuinely on a student path and profile hasn't loaded
  //
  // This prevents the "flash of student nav" when the client-side profile fetch
  // is slower than the render — the server already redirected admin users to
  // /dashboard/admin, so the path tells us the role reliably.
  const inferredRole: UserRole =
    pathname.startsWith("/dashboard/admin")       ? "admin"
    : pathname.startsWith("/dashboard/institution") ? "institution"
    : pathname.startsWith("/dashboard/partner")     ? "recruitment_partner"
    : pathname.startsWith("/dashboard/employer")    ? "employer"
    : "student";

  const role  = (profile?.role as UserRole) ?? inferredRole;
  const items = NAV_ITEMS[role] ?? NAV_ITEMS.student;

  // Show a minimal skeleton while profile is still loading so nav never flickers
  if (loading && !profile) {
    return (
      <aside className={`${collapsed ? "w-16" : "w-64"} h-screen bg-navy-900 border-r border-white/[0.07] flex-shrink-0 transition-all duration-300`}>
        <div className="p-4 space-y-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-white/[0.05] animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-navy-900/95 border-r border-white/[0.07]",
        "transition-all duration-300 backdrop-blur-md",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.07]",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center flex-shrink-0 shadow-blue-sm">
          <span className="font-display font-bold text-white text-sm">PP</span>
        </div>
        {!collapsed && (
          <span className="font-display text-[1.35rem] leading-none tracking-tight">
            <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
          </span>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-sm">
              {(profile?.full_name ?? "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white/90 font-body text-sm font-semibold truncate">
                {profile?.full_name ?? "User"}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-[10px] font-semibold tracking-wider uppercase">
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-all duration-150",
                collapsed && "justify-center px-2",
                active
                  ? "bg-gold-400/[0.12] text-gold-300 border border-gold-400/25"
                  : "text-white/50 hover:text-white/85 hover:bg-white/[0.06]"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("flex-shrink-0", active ? "w-4.5 h-4.5" : "w-4 h-4")} strokeWidth={active ? 2 : 1.75} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: collapse + sign out */}
      <div className="px-2 py-3 border-t border-white/[0.07] space-y-0.5">
        <button
          onClick={() => setCollapsed(v => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-white/35 hover:text-white/65 hover:bg-white/[0.05] transition-all font-body text-sm",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>

        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08] transition-all font-body text-sm",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
