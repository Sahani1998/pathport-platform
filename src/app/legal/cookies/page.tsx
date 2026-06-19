import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Cookie Policy | PathPort",
  description: "PathPort's cookie policy — what cookies we use, which are strictly necessary, and how to manage preferences under Singapore's PDPA.",
  alternates: { canonical: "/legal/cookies" },
};

const CATEGORIES = [
  {
    name: "Strictly Necessary",
    canDisable: false,
    desc: "These cookies are required for the PathPort platform to function. They manage your login session, prevent cross-site request forgery, and maintain your application state. You cannot use PathPort without these cookies.",
    examples: [
      { name: "sb-auth-token", purpose: "Supabase authentication session token", expiry: "Session" },
      { name: "csrf-token", purpose: "Cross-site request forgery protection", expiry: "Session" },
    ],
  },
  {
    name: "Functional",
    canDisable: true,
    desc: "These cookies remember your preferences to improve your experience, such as remembering your cookie consent choices.",
    examples: [
      { name: "pp-cookie-consent", purpose: "Stores your cookie consent preferences", expiry: "365 days" },
    ],
  },
  {
    name: "Analytics",
    canDisable: true,
    desc: "Analytics cookies help PathPort understand how the platform is used — which pages are visited, how students navigate the course directory, and where users leave the application flow. PathPort does not share analytics data with third parties. Analytics cookies are not loaded without your consent.",
    examples: [
      { name: "Analytics cookies", purpose: "Page view and session data (not yet implemented)", expiry: "90 days" },
    ],
  },
  {
    name: "Marketing",
    canDisable: true,
    desc: "Marketing cookies are not currently used by PathPort. No third-party advertising or remarketing tags are deployed on this platform. This category is listed for completeness as PathPort may consider analytics or awareness tools in the future — any such deployment will require renewed consent.",
    examples: [],
  },
];

export default function CookiePolicyPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Legal Center", url: "/legal" }, { name: "Cookie Policy", url: "/legal/cookies" }])} />
      <Breadcrumbs trail={[{ name: "Legal Center", url: "/legal" }, { name: "Cookie Policy", url: "/legal/cookies" }]} />

      <PageHero
        eyebrow="Cookie Policy"
        title="What cookies PathPort uses."
        subtitle="PathPort uses minimal cookies. Most are strictly necessary for authentication and security. This policy explains each type and how to manage your preferences."
      />

      <div className="text-white/35 font-body text-xs mb-8">Effective date: 19 June 2026 · Governed by Singapore PDPA 2012</div>

      <section className="mb-8">
        <h2 className="font-display text-xl text-white mb-3">What are cookies?</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed">Cookies are small text files stored in your browser by websites you visit. PathPort uses cookies to authenticate users, maintain session state, and remember preferences. PathPort does not use cookies for cross-site tracking or behavioural advertising.</p>
      </section>

      <section className="mb-10 space-y-6">
        {CATEGORIES.map(cat => (
          <div key={cat.name} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-display text-lg text-white">{cat.name}</h3>
              <span className={`px-2.5 py-1 rounded-full font-body text-xs font-semibold ${cat.canDisable ? "bg-white/[0.06] text-white/50 border border-white/[0.10]" : "bg-gold-400/10 text-gold-400 border border-gold-400/25"}`}>
                {cat.canDisable ? "Optional" : "Required"}
              </span>
            </div>
            <div className="p-5">
              <p className="text-white/55 font-body text-sm leading-relaxed mb-4">{cat.desc}</p>
              {cat.examples.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/[0.05]">
                    <span className="text-white/25 font-body text-[10px] uppercase tracking-widest">Cookie name</span>
                    <span className="text-white/25 font-body text-[10px] uppercase tracking-widest">Purpose</span>
                    <span className="text-white/25 font-body text-[10px] uppercase tracking-widest">Expiry</span>
                  </div>
                  {cat.examples.map(ex => (
                    <div key={ex.name} className="grid grid-cols-3 gap-2 p-3 border-t border-white/[0.04]">
                      <span className="text-white/70 font-body text-xs font-mono">{ex.name}</span>
                      <span className="text-white/50 font-body text-xs">{ex.purpose}</span>
                      <span className="text-white/40 font-body text-xs">{ex.expiry}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-white mb-3">Managing your cookie preferences</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">You can manage optional cookie categories via the cookie preference banner. You may also clear all cookies via your browser settings — note that clearing the authentication cookie will log you out of PathPort.</p>
        <p className="text-white/60 font-body text-sm leading-relaxed">To withdraw consent at any time, clear your browser cookies or contact PathPort at <a href="mailto:pathportsg@gmail.com" className="text-gold-400 hover:underline">pathportsg@gmail.com</a> and we will provide a mechanism to update your stored preferences.</p>
      </section>
    </MarketingShell>
  );
}
