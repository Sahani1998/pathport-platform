"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GoldButton from "@/components/ui/GoldButton";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home",     href: "#"          },
  { label: "About",    href: "#about"      },
  { label: "Partners", href: "#colleges"   },
  { label: "Students", href: "#journey"    },
  { label: "Login",    href: "#"           },
  { label: "Contact",  href: "#cta"        },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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

        {/* ── Logo ─────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="PathPort home">
          {/* PP Icon */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center shadow-blue-sm group-hover:shadow-blue transition-shadow duration-300">
            <span className="font-display font-bold text-white text-base leading-none tracking-tighter">PP</span>
          </div>
          <span className="font-display text-[1.5rem] leading-none tracking-tight">
            <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
          </span>
        </Link>

        {/* ── Desktop Nav ───────────────────────────── */}
        <ul className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="font-body text-sm text-white/60 hover:text-white transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gold-400/70 rounded-full transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        {/* ── CTAs ─────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <GoldButton variant="outline-gold" size="sm">Partner With Us</GoldButton>
          <GoldButton variant="solid-gold"   size="sm">Register</GoldButton>
        </div>

        {/* ── Mobile Toggle ────────────────────────── */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 text-white/70 hover:text-gold-400 transition-colors rounded-lg"
        >
          {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────── */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          "bg-navy-900/97 backdrop-blur-2xl border-b border-white/[0.07]",
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="px-5 pt-3 pb-7 space-y-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 px-4 rounded-xl font-body text-base text-white/65 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              {label}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <GoldButton variant="outline-gold" size="md" className="w-full" onClick={() => setMobileOpen(false)}>
              Partner With Us
            </GoldButton>
            <GoldButton variant="solid-gold" size="md" className="w-full" onClick={() => setMobileOpen(false)}>
              Register
            </GoldButton>
          </div>
        </div>
      </div>
    </header>
  );
}
