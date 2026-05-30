import { Globe, CheckCircle2 } from "lucide-react";

const ARRIVAL_STEPS = [
  { title: "Flight & Visa Assistance",    desc: "PathPort handles your student pass documentation and coordinates with ICA.",     done: false },
  { title: "Airport Pickup",              desc: "A PathPort representative will meet you at Changi Airport.",                     done: false },
  { title: "Accommodation",              desc: "We arrange temporary housing or connect you with student accommodation partners.", done: false },
  { title: "College Orientation",        desc: "Attend your college's orientation programme and meet your classmates.",           done: false },
  { title: "SIM Card & Bank Account",    desc: "Get a local SIM and open a bank account — we guide you through both.",           done: false },
  { title: "Internship Onboarding",      desc: "After 6 months of study, your internship placement begins.",                     done: false },
];

export default function StudentArrivalPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Arrival Services</h2>
        <p className="text-white/40 font-body text-sm">Your white-glove support when you land in Singapore</p>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-br from-pathBlue-600/15 to-transparent border border-pathBlue-500/20">
        <p className="text-pathBlue-400 font-body text-xs font-semibold tracking-wider uppercase mb-1">Status</p>
        <p className="text-white/70 font-body text-sm">
          Arrival services are activated once your application is approved and your student pass is processed.
          Your PathPort advisor will guide you through every step.
        </p>
      </div>

      <div className="space-y-3">
        {ARRIVAL_STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              step.done ? "bg-emerald-500/20 border border-emerald-400/30" : "bg-white/[0.05] border border-white/10"
            }`}>
              {step.done
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <span className="font-body text-xs text-white/30 font-bold">{i + 1}</span>}
            </div>
            <div>
              <p className="font-body text-sm text-white/80 font-semibold">{step.title}</p>
              <p className="font-body text-xs text-white/40 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <Globe className="w-8 h-8 text-gold-400/50" />
        <p className="text-white/50 font-body text-sm text-center">Questions about arriving in Singapore?</p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 WhatsApp your advisor
        </a>
      </div>
    </div>
  );
}
