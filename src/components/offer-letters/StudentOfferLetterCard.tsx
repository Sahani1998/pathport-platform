import { Download, FileCheck2, CalendarDays, Clock } from "lucide-react";
import type { OfferLetter } from "@/types/offer-letters";

interface Props {
  letters: OfferLetter[];
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function StudentOfferLetterCard({ letters }: Props) {
  if (letters.length === 0) return null;

  const latest = letters[0];
  const expired = isExpired(latest.expiry_date);

  return (
    <div className={`p-4 rounded-2xl border space-y-3 ${
      expired
        ? "bg-red-500/[0.05] border-red-400/15"
        : "bg-gold-400/[0.06] border-gold-400/20"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className={`w-4 h-4 ${expired ? "text-red-400" : "text-gold-400"}`} />
          <p className={`font-body text-sm font-semibold ${expired ? "text-red-400/80" : "text-gold-400"}`}>
            Offer Letter Ready
          </p>
        </div>
        {expired && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-400/20 text-red-400 font-body text-[10px] font-semibold">
            Expired
          </span>
        )}
      </div>

      {/* Latest version details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-white/30 font-body text-[9px] uppercase tracking-wider mb-0.5">Issued</p>
          <p className="text-white/60 font-body text-xs">{fmtDate(latest.created_at)}</p>
        </div>
        <div>
          <p className="text-white/30 font-body text-[9px] uppercase tracking-wider mb-0.5">Version</p>
          <p className="text-white/60 font-body text-xs">v{latest.version}</p>
        </div>
        {latest.expiry_date && (
          <div className="col-span-2 flex items-center gap-1.5">
            <CalendarDays className={`w-3 h-3 ${expired ? "text-red-400/60" : "text-amber-400/60"}`} />
            <p className={`font-body text-xs ${expired ? "text-red-400/70" : "text-amber-400/70"}`}>
              {expired ? "Expired" : "Expires"} {fmtDate(latest.expiry_date)}
            </p>
          </div>
        )}
      </div>

      {/* Download latest */}
      <a
        href={`/api/offer-letters/${latest.id}/download`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all"
      >
        <Download className="w-4 h-4" /> Download Offer Letter
      </a>

      {/* Older versions */}
      {letters.length > 1 && (
        <details className="group">
          <summary className="cursor-pointer text-white/30 font-body text-xs hover:text-white/50 transition-colors flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {letters.length - 1} earlier version{letters.length - 1 !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-1.5 pl-4 border-l border-white/[0.08]">
            {letters.slice(1).map(l => (
              <div key={l.id} className="flex items-center justify-between gap-2">
                <span className="text-white/30 font-body text-xs">v{l.version} — {fmtDate(l.created_at)}</span>
                <a
                  href={`/api/offer-letters/${l.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pathBlue-400/70 hover:text-pathBlue-300 font-body text-xs transition-colors flex items-center gap-1"
                >
                  <Download className="w-2.5 h-2.5" /> Download
                </a>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
