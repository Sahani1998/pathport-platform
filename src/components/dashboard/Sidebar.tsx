"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import {
  LayoutDashboard, FileText, BookOpen, Briefcase, Building2,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
  GraduationCap, BarChart2, UserCircle, ClipboardList,
  Globe, Award, MessageSquare, Bell, Loader2, Stethoscope,
} from "lucide-react";

// ─── Role-specific nav items ──────────────────────────────────────────────────

const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  student: [
    { label: "Dashboard",        href: "/dashboard/student",              icon: LayoutDashboard },
    { label: "My Applications",  href: "/dashboard/student/applications", icon: FileText        },
    { label: "Notifications",    href: "/dashboard/student/notifications",icon: Bell            },
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
    { label: "Courses",          href: "/dashboard/admin/courses",        icon: BookOpen        },
    { label: "Offer Letters",    href: "/dashboard/admin/offer-letters",  icon: FileText        },
    { label: "Partners",         href: "/dashboard/admin/partner-applications", icon: Award      },
    { label: "Analytics",        href: "/dashboard/admin/analytics",      icon: BarChart2       },
    { label: "Notifications",    href: "/dashboard/admin/notifications",  icon: Bell            },
    { label: "Diagnostics",      href: "/dashboard/admin/diagnostic",     icon: Stethoscope     },
    { label: "Settings",         href: "/dashboard/admin/settings",       icon: Settings        },
  ],
  institution: [
    { label: "Dashboard",        href: "/dashboard/institution",             icon: LayoutDashboard },
    { label: "Students",         href: "/dashboard/institution/students",    icon: GraduationCap   },
    { label: "Applications",     href: "/dashboard/institution/applications",icon: FileText        },
    { label: "Documents",        href: "/dashboard/institution/documents",   icon: ClipboardList   },
    { label: "Notifications",    href: "/dashboard/institution/notifications", icon: Bell          },
    { label: "Courses",          href: "/dashboard/institution/courses",     icon: BookOpen        },
    { label: "Reports",          href: "/dashboard/institution/reports",     icon: BarChart2       },
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
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  // NOTE: We never block the whole sidebar on loading.
  // The role is already known from the URL (the server already verified it),
  // so nav items render immediately from inferredRole.
  // Only the name/avatar in the user-info strip shows a skeleton while loading.

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    console.log("[Auth] signOut start");

    // 1. Server-side sign-out — calls supabase.auth.signOut({ scope: "global" })
    //    inside the cookie-aware server client so SSR cookies are deleted at
    //    the HTTP layer. Client-only signOut leaves the SSR cookie behind and
    //    the next request re-authenticates as the previous user.
    try {
      const res = await fetch("/api/auth/signout", { method: "POST", cache: "no-store" });
      console.log("[Auth] server signOut:", res.status);
    } catch (err) {
      console.error("[Auth] server signOut error:", err);
    }

    // 2. Client-side sign-out — clears the in-memory session and React state
    //    (user/profile) in AuthContext. Bounded by the 3s timeout there.
    try {
      await signOut();
      console.log("[Auth] client signOut success");
    } catch (err) {
      console.error("[Auth] client signOut error:", err);
    }

    // 3. Nuke every Supabase key from localStorage AND sessionStorage so a
    //    fresh login on the same tab can't reuse cached tokens.
    try {
      for (const store of [localStorage, sessionStorage]) {
        Object.keys(store)
          .filter(k => k.startsWith("sb-") || k.startsWith("supabase-"))
          .forEach(k => store.removeItem(k));
      }
      console.log("[Auth] storage cleared");
    } catch {
      // Storage unavailable in some environments — safe to ignore
    }

    // 4. Hard redirect to /login — no history entry, forces full reload so
    //    middleware re-validates auth from scratch on the next request.
    console.log("[Auth] redirecting");
    window.location.replace("/login");
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

      {/* User info — name/avatar pulse while loading; role badge always visible */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            {/* Avatar: pulse until profile loads, then show initial */}
            {loading && !profile ? (
              <div className="w-9 h-9 rounded-full bg-white/[0.08] animate-pulse flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-sm">
                {(profile?.full_name ?? "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {/* Name: pulse until loaded */}
              {loading && !profile ? (
                <div className="h-4 w-24 rounded-lg bg-white/[0.08] animate-pulse mb-1.5" />
              ) : (
                <p className="text-white/90 font-body text-sm font-semibold truncate">
                  {profile?.full_name ?? "User"}
                </p>
              )}
              {/* Role badge: always visible from inferredRole */}
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
          disabled={signingOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08] transition-all font-body text-sm",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent",
            collapsed && "justify-center"
          )}
          title={collapsed ? (signingOut ? "Signing out…" : "Sign out") : undefined}
          aria-busy={signingOut}
        >
          {signingOut
            ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
            : <LogOut className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span>{signingOut ? "Signing out…" : "Sign Out"}</span>}
        </button>
      </div>
    </aside>
  );
}
