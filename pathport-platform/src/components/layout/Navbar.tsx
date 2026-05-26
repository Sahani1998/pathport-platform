"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GoldButton from "@/components/ui/GoldButton";
import {
  Menu, X, ChevronDown, Building2, Users, Briefcase,
  GraduationCap, LayoutDashboard, LogOut, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Partner dropdown items ────────────────────────────────────────────────────
const PARTNER_ITEMS = [
  {
    label:       "Institutions",
    href:        "/partners/institutions",
    icon:        Building2,
    description: "List courses, manage applications, and upload LOAs",
    emoji:       "🏫",
  },
  {
    label:       "Recruitment Partners",
    href:        "/partners/recruitment-partners",
    icon:        Users,
    description: "Refer students, track applications, and earn commissions",
    emoji:       "🤝",
  },
  {
    label:       "Employers",
    href:        "/partners/employers",
    icon:        Briefcase,
    description: "Hire verified internship-ready diploma students",
    emoji:       "💼",
  },
];

// ─── Login dropdown items (NO admin) ──────────────────────────────────────────
const LOGIN_ITEMS = [
  { label: "Student Login",             href: "/login", emoji: "🎓" },
  { label: "Institution Login",         href: "/login", emoji: "🏫" },
  { label: "Recruitment Partner Login", href: "/login", emoji: "🤝" },
  { label: "Employer Login",            href: "/login", emoji: "💼" },
];

type OpenDropdown = "partners" | "login" | null;

// ─── Sub-component: Partners dropdown panel ────────────────────────────────────
function PartnersPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-2 w-[340px] bg-navy-800/98 border border-white/[0.10] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden z-50 animate-slide-up">
      <div className="p-2">
        {PARTNER_ITEMS.map(({ label, href, description, emoji }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
            <div>
              <p className="font-body font-semibold text-sm text-white/90 group-hover:text-white mb-0.5">{label}</p>
              <p className="font-body text-xs text-white/40 leading-snug">{description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="border-t border-white/[0.07] p-3">
        <Link
          href="/partner-with-us"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 text-gold-400 hover:bg-gold-400/[0.14] hover:text-gold-300 font-body text-sm font-semibold transition-all"
        >
          Apply to Partner With Us →
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-component: Login dropdown panel ──────────────────────────────────────
function LoginPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-[260px] bg-navy-800/98 border border-white/[0.10] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden z-50 animate-slide-up">
      <div className="p-2">
        {LOGIN_ITEMS.map(({ label, href, emoji }) => (
          <Link
            key={label}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/[0.06] transition-colors group"
          >
            <span className="text-lg flex-shrink-0">{emoji}</span>
            <span className="font-body text-sm text-white/75 group-hover:text-white/95">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname               = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [mobilePartnersOpen, setMobilePartnersOpen] = useState(false);
  const partnersRef = useRef<HTMLLIElement>(null);
  const loginRef    = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Body scroll lock for mobile
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        partnersRef.current && !partnersRef.current.contains(e.target as Node) &&
        loginRef.current    && !loginRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape key closes dropdowns
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenDropdown(null); setMobileOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const closeAll = useCallback(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setMobilePartnersOpen(false);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    await signOut();
    closeAll();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-navy-900/92 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
          : "bg-navy-900/70 backdrop-blur-md"
      )}
    >
      <nav className="max-w-7xl mx-auto px-5 md:px-10 h-[68px] flex items-center justify-between gap-4">

        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={closeAll}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center shadow-blue-sm group-hover:shadow-blue transition-shadow duration-300">
            <span className="font-display font-bold text-white text-sm leading-none">PP</span>
          </div>
          <span className="font-display text-[1.5rem] leading-none tracking-tight">
            <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
          </span>
        </Link>

        {/* ── Desktop Centre Nav ─────────────────────────────────────── */}
        <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {/* Students */}
          <li>
            <Link
              href="/students"
              className={cn(
                "px-4 py-2 rounded-xl font-body text-sm tracking-wide transition-all duration-200",
                isActive("/students")
                  ? "text-gold-300 bg-gold-400/[0.08]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
              )}
            >
              Students
            </Link>
          </li>

          {/* Study Destination */}
          <li>
            <Link
              href="/study-destination"
              className={cn(
                "px-4 py-2 rounded-xl font-body text-sm tracking-wide transition-all duration-200",
                isActive("/study-destination")
                  ? "text-gold-300 bg-gold-400/[0.08]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
              )}
            >
              Study Destination
            </Link>
          </li>

          {/* Partners dropdown */}
          <li className="relative" ref={partnersRef}>
            <button
              onClick={() => setOpenDropdown(v => v === "partners" ? null : "partners")}
              onMouseEnter={() => setOpenDropdown("partners")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm tracking-wide transition-all duration-200",
                isActive("/partners")
                  ? "text-gold-300 bg-gold-400/[0.08]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
              )}
              aria-expanded={openDropdown === "partners"}
              aria-haspopup="true"
            >
              Partners
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "partners" && "rotate-180")} />
            </button>
            {openDropdown === "partners" && (
              <div onMouseLeave={() => setOpenDropdown(null)}>
                <PartnersPanel onClose={closeAll} />
              </div>
            )}
          </li>
        </ul>

        {/* ── Desktop Right CTAs ─────────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
          {loading ? (
            <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
          ) : user ? (
            /* Authenticated */
            <>
              <Link href="/dashboard">
                <GoldButton variant="outline-gold" size="sm" className="gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </GoldButton>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/45 hover:text-red-400 hover:border-red-400/30 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Unauthenticated */
            <>
              {/* Partner With Us */}
              <Link href="/partner-with-us">
                <button className="px-4 py-2 rounded-xl border border-white/[0.15] text-white/55 hover:text-white/90 hover:border-white/30 font-body text-sm tracking-wide transition-all duration-200">
                  Partner With Us
                </button>
              </Link>

              {/* Register as Student */}
              <Link href="/signup">
                <GoldButton variant="solid-gold" size="sm">Register as Student</GoldButton>
              </Link>

              {/* Login dropdown */}
              <div className="relative" ref={loginRef}>
                <button
                  onClick={() => setOpenDropdown(v => v === "login" ? null : "login")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-sm tracking-wide transition-all duration-200",
                    openDropdown === "login"
                      ? "border-gold-400/40 text-gold-300 bg-gold-400/[0.07]"
                      : "border-white/[0.12] text-white/60 hover:text-white/90 hover:border-white/25"
                  )}
                  aria-expanded={openDropdown === "login"}
                  aria-haspopup="true"
                >
                  Login
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "login" && "rotate-180")} />
                </button>
                {openDropdown === "login" && <LoginPanel onClose={closeAll} />}
              </div>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ───────────────────────────────────────── */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen(v => !v)}
          className="lg:hidden p-2 text-white/70 hover:text-gold-400 transition-colors rounded-lg flex-shrink-0"
        >
          {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
      </nav>

      {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          "bg-navy-900/98 backdrop-blur-2xl border-b border-white/[0.08]",
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="px-5 pt-3 pb-8 space-y-1">
          {/* Main links */}
          <Link href="/students" onClick={closeAll}
            className="block py-3 px-4 rounded-xl font-body text-base text-white/70 hover:text-white hover:bg-white/[0.05] transition-all">
            Students
          </Link>
          <Link href="/study-destination" onClick={closeAll}
            className="block py-3 px-4 rounded-xl font-body text-base text-white/70 hover:text-white hover:bg-white/[0.05] transition-all">
            Study Destination
          </Link>

          {/* Partners expandable */}
          <div>
            <button
              onClick={() => setMobilePartnersOpen(v => !v)}
              className="w-full flex items-center justify-between py-3 px-4 rounded-xl font-body text-base text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Partners
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", mobilePartnersOpen && "rotate-180")} />
            </button>
            {mobilePartnersOpen && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-white/[0.08] pl-4">
                {PARTNER_ITEMS.map(({ label, href, emoji, description }) => (
                  <Link key={href} href={href} onClick={closeAll}
                    className="block py-2.5 px-3 rounded-xl transition-all hover:bg-white/[0.04]">
                    <span className="font-body text-sm text-white/75">{emoji} {label}</span>
                    <p className="font-body text-xs text-white/35 mt-0.5">{description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-white/[0.07] my-2 mx-4" />

          {/* Auth section */}
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" onClick={closeAll}
                className="block py-3 px-4 rounded-xl font-body text-base text-white/70 hover:text-white hover:bg-white/[0.05] transition-all">
                🏠 My Dashboard
              </Link>
              <button onClick={handleSignOut}
                className="block w-full text-left py-3 px-4 rounded-xl font-body text-base text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.07] transition-all">
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Login options */}
              <p className="px-4 pt-2 pb-1 text-white/30 font-body text-xs uppercase tracking-widest">Login As</p>
              {LOGIN_ITEMS.map(({ label, href, emoji }) => (
                <Link key={label} href={href} onClick={closeAll}
                  className="block py-2.5 px-4 rounded-xl font-body text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-all">
                  {emoji} {label}
                </Link>
              ))}

              <div className="h-px bg-white/[0.07] my-2 mx-4" />

              {/* Register + Partner */}
              <div className="pt-2 space-y-2.5 px-0">
                <Link href="/signup" onClick={closeAll}>
                  <GoldButton variant="solid-gold" size="md" className="w-full">
                    Register as Student
                  </GoldButton>
                </Link>
                <Link href="/partner-with-us" onClick={closeAll}>
                  <GoldButton variant="outline-gold" size="md" className="w-full">
                    Partner With Us
                  </GoldButton>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
