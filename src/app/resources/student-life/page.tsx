import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Student Life in Singapore for Indian Students | PathPort",
  description: "Life in Singapore as an Indian student — food, MRT, culture, Indian community, healthcare, religious services, staying connected, and adjusting to a new city.",
  alternates: { canonical: "/resources/student-life" },
};

export default function StudentLifePage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Student Life", url: "/resources/student-life" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Student Life", url: "/resources/student-life" }]} />

      <PageHero
        eyebrow="Student Life"
        title="Life in Singapore as an Indian student."
        subtitle="Singapore is safe, clean, efficient, and multicultural. The adjustment from India is real — but smaller than most students expect. Here is what daily life looks like."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Food</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">You will not struggle to find Indian food in Singapore. Little India (Tekka, Serangoon Road) has dozens of Indian restaurants, banana leaf restaurants, biryani shops, and South Indian tiffin centres. Hawker centres across Singapore serve Indian-Muslim food, North Indian rotis, and South Indian dosas at extremely affordable prices (SGD 3–6 a meal).</p>
        <p className="text-white/60 font-body text-sm leading-relaxed">Indian grocery stores in Little India and Mustafa Centre stock imported Indian spices, dal, rice, snacks, and even pickles. Cooking your own food is very practical in Singapore and significantly reduces your monthly food budget.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Transport</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">Singapore&apos;s MRT (Mass Rapid Transit) is one of the best metro systems in Asia — clean, air-conditioned, punctual, and inexpensive. A monthly transport card (EZ-Link or SimplyGo) costs approximately SGD 70–120 depending on how much you travel. Bus networks cover areas the MRT does not reach.</p>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { tip: "Get your EZ-Link card at any MRT station or 7-Eleven on arrival.", detail: "Load it with SGD 20–30 for your first week." },
            { tip: "Use Google Maps for MRT + bus routing.", detail: "Singapore transit data is excellent on Google Maps — it shows the exact next bus time." },
            { tip: "Grab is Singapore&apos;s dominant ride-hailing app.", detail: "Use it for late nights or journeys to areas not well-served by MRT. Prices are competitive with India&apos;s Ola/Uber." },
            { tip: "Cycling is growing.", detail: "Many areas now have bike lanes. Shared bikes (like Anywheel) are available. Cycling is practical for short distances." },
          ].map(tip => (
            <div key={tip.tip} className="p-4 border-t border-white/[0.05] first:border-t-0">
              <p className="font-body font-semibold text-white/75 text-sm mb-0.5">{tip.tip}</p>
              <p className="text-white/40 font-body text-xs">{tip.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Indian community</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">Singapore&apos;s Indian community is large, diverse, and welcoming. Tamil, Telugu, Hindi, and Malayalam communities all have active presence. Community organisations, temples, and cultural events are regular throughout the year.</p>
        <div className="space-y-2">
          {[
            "Little India (Tekka / Serangoon Road) — the heart of Singapore&apos;s Indian community.",
            "Sri Veeramakaliamman Temple (Serangoon Road) — major Hindu temple.",
            "Mustafa Centre — 24-hour department store with extensive Indian goods.",
            "Indian social media groups (WhatsApp, Facebook) for students in Singapore — ask your college for current group links.",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-gold-400 text-xs mt-0.5">→</span>
              <p className="text-white/60 font-body text-sm">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Culture and adjustment</h2>
        <div className="space-y-3">
          {[
            { title: "Singapore is safe", body: "Singapore consistently ranks as one of the world&apos;s safest cities. Petty crime is low. You can walk alone at night, use public transport safely, and generally feel secure. This is genuinely different from many Indian cities." },
            { title: "English is the working language", body: "All official communication, education, and business is in English. Singapore English (Singlish) has its own expressions — &quot;can, lah, sia, shiok&quot; — but standard English is always understood and used professionally." },
            { title: "Rules and fines are real", body: "Singapore enforces laws strictly. Littering, jaywalking, spitting, and chewing gum in public are subject to fines. Respect local laws — they apply to you as a Student Pass holder." },
            { title: "Climate", body: "Singapore is hot and humid year-round (28–34°C). There is no winter. Rain is frequent but usually brief. Air-conditioning is everywhere indoors — carry a light jacket for MRT and classrooms." },
          ].map(item => (
            <div key={item.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/85 text-sm mb-1.5">{item.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Staying connected with home</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed">Get a Singapore SIM card (Singtel, Starhub, M1, or MVNOs like Circles.Life) on arrival — plans with data start from SGD 8/month. WhatsApp and video calls work seamlessly. Most students call home daily.</p>
      </section>
    </MarketingShell>
  );
}
