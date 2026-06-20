import Image from "next/image";
import StudentInterestForm from "@/components/sections/StudentInterestForm";

/**
 * FinalCTABand — full-bleed dark conversion section at the foot of the page.
 *
 * A second-chance form for visitors who scrolled past the hero. Photo of the
 * Singapore skyline at night sets the mood; the existing StudentInterestForm
 * does the actual lead-capture work.
 */
export default function FinalCTABand() {
  return (
    <section id="interest-form" className="relative w-full overflow-hidden bg-[#06142E]">
      {/* Photo background */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.18]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-900/85 to-navy-900" />
      </div>

      <div className="relative layout-shell section-airy">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="eyebrow text-gold-400 mb-5">Ready when you are</p>
          <h2 className="display-2 text-white mb-6">
            Start your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
              Singapore journey
            </span>{" "}
            today.
          </h2>
          <p className="lead text-white/65">
            Register your interest for free. A PathPort advisor will call you within 24 hours with a personalised Singapore diploma pathway.
          </p>
        </div>

        <StudentInterestForm />

        <p className="mt-10 text-center text-white/45 font-body text-sm">
          Prefer to talk first?{" "}
          <a
            href="https://wa.me/6583776492"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
          >
            WhatsApp +65 8377 6492
          </a>
        </p>
      </div>
    </section>
  );
}
