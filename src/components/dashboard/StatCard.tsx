import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label:      string;
  value:      string | number;
  icon:       LucideIcon;
  trend?:     string;
  trendUp?:   boolean;
  gold?:      boolean;
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, gold }: StatCardProps) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5",
      gold
        ? "bg-gold-400/[0.07] border-gold-400/30 hover:border-gold-400/45 hover:shadow-gold-sm"
        : "bg-white/[0.04] border-white/[0.08] hover:border-white/15"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          gold
            ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm"
            : "bg-white/[0.08] border border-white/10"
        )}>
          <Icon className={cn("w-5 h-5", gold ? "text-navy-900" : "text-gold-400")} strokeWidth={1.75} />
        </div>
        {trend && (
          <span className={cn(
            "font-body text-xs font-semibold px-2 py-0.5 rounded-full",
            trendUp
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border border-red-500/30"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <div className="font-display text-3xl text-white font-bold leading-none mb-1">
        {value}
      </div>
      <p className="text-white/45 font-body text-sm">{label}</p>
    </div>
  );
}
