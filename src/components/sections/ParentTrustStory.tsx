import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, BadgeCheck, Wallet, MessageCircle } from "lucide-react";

/**
 * ParentTrustStory — warm editorial section addressed to the parent of
 * the student. Replaces the previous 4-card grid (WhyTrustPathPort) with
 * a single image-anchored composition + three "pillars" displayed as a
 * textured list, not as feature cards.
 *
 * The tone is reassuring and direct — parents in Tier-1/2 Indian cities
 * are evaluating PathPort against family money and family reputation.
 */

const PILLARS = [
  {
    Icon: BadgeCheck,
    title: "Only verified institutions.",
    body:
      "Every college listed on PathPort is CPE-registered, EduTrust-certified, and audited. We do not list institutions that are still pending registration.",
  },
  {
    Icon: Wallet,
    title: "Transparent fees, no hidden costs.",
    body:
      "The price displayed is the price your child’s college invoices. No agent commission. No platform fee. Currency conversion at a published rate.",
  },
  {
    Icon: MessageCircle,
    title: "Real humans on WhatsApp.",
    body:
      "No chatbots, no ticket queues. A named PathPort advisor responds personally — and answers calls from parents directly, in English or Hindi.",
  },
];

export default function ParentTrustStory() {
  return (
    <section className="relative cream-band overflow-hidden">
      <div className="layout-shell section-airy">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-12 lg:gap-16 xl:gap-20 items-center">

          {/* Photo */}
          <Reveal className="relative order-last lg:order-first">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(166,107,0,0.35)]">
              <Image
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=80"
                alt="A bright study space — the kind of safe, modern environment Singapore campuses provide"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#3A2A00]/15 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 left-6 sm:-left-6 warm-panel-card rounded-2xl px-5 py-3">
              <p className="font-body text-navy-800/55 text-[10px] uppercase tracking-[0.15em] font-semibold">For families</p>
              <p className="font-display text-base text-navy-900 leading-tight mt-0.5">One promise behind every application</p>
            </div>
          </Reveal>

          {/* Editorial pillars */}
          <Reveal delay={120}>
            <p className="eyebrow text-gold-700 mb-5">Built for parents</p>
            <h2 className="display-2 text-navy-900 mb-7">
              For the family making{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-700 to-gold-600">
                the decision.
              </span>
            </h2>

            <ul className="space-y-7 mb-9">
              {PILLARS.map(({ Icon, title, body }) => (
                <li key={title} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gold-100 border border-gold-500/30 text-gold-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-display text-xl text-navy-900 leading-snug mb-1.5">{title}</p>
                    <p className="prose-lg text-navy-800/70">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Link
                href="/for-parents"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-600 hover:bg-gold-500 text-white font-body text-sm font-bold transition-colors"
              >
                Read the parent guide
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 text-navy-800/70 hover:text-navy-900 font-body text-sm font-semibold transition-colors"
              >
                Visit the Trust Center
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
