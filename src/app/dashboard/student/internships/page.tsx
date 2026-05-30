import { Briefcase } from "lucide-react";

export default function StudentInternshipsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Internships</h2>
        <p className="text-white/40 font-body text-sm">Paid internship placements in Singapore</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div className="w-16 h-16 rounded-2xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-gold-400" />
        </div>
        <h3 className="font-display text-2xl text-white mb-2">Coming Soon</h3>
        <p className="text-white/40 font-body text-sm text-center max-w-sm">
          Internship placements (S$800–S$1,500/month) are part of the 6+6 pathway.
          Your PathPort advisor will match you with employers after enrolment.
        </p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 Talk to your advisor
        </a>
      </div>
    </div>
  );
}
