import GoldButton from "@/components/ui/GoldButton";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function CTASection() {
  return (
    <section id="cta" className="relative py-36 overflow-hidden bg-[#06142E]">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy-800/40 via-transparent to-navy-950 pointer-events-none" />
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gold-400/[0.06] blur-[150px] pointer-events-none" />
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] max-w-full h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-5 md:px-10 text-center">
        <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/25 rounded-full px-4 py-2 mb-7">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-gold-300 font-body text-sm font-medium tracking-wider">
            🇮🇳 India&apos;s Singapore Diploma Platform
          </span>
        </div>

        <h2 className="font-display text-5xl md:text-[3.6rem] text-white mb-7 leading-[1.06]">
          Start Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
            Singapore Journey
          </span>{" "}
          Today
        </h2>

        <p className="text-white/48 font-body text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
          Register your interest for free. A PathPort advisor will call you within 24 hours with your personalised Singapore diploma pathway.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <GoldButton variant="solid-gold" size="lg" className="group min-w-[230px]">
            Register My Interest — Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </GoldButton>
          <GoldButton variant="outline-gold" size="lg" className="min-w-[230px]">
            <MessageCircle className="w-5 h-5" />
            WhatsApp: +65 8377 6492
          </GoldButton>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3" role="list">
          {[
            "No Registration Fee",
            "Advisor Call Within 24 Hours",
            "Offer Letter Support",
            "Arrival Services Support",
          ].map(signal => (
            <li key={signal} className="flex items-center gap-2 text-white/50 font-body text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden />
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
