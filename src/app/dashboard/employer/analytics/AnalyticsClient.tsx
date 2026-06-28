"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Users, CheckCircle2, TrendingUp, Briefcase } from "lucide-react";

type Funnel = { stage: string; count: number }[];
type PerPosting = { title: string; applicants: number }[];
type Weekly = { week: string; applications: number }[];
type Summary = { totalApplicants: number; hired: number; conversionRate: number; activePostings: number };

const EMERALD = "#34D399";
const GOLD    = "#C9A84C";
const BLUE    = "#5B9BD5";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#0B1322",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#fff",
      fontSize: "12px",
    },
    labelStyle: { color: "rgba(255,255,255,0.6)" },
    cursor: { fill: "rgba(255,255,255,0.04)" },
  };
}

export default function AnalyticsClient({
  funnel, perPosting, weekly, summary,
}: {
  funnel: Funnel; perPosting: PerPosting; weekly: Weekly; summary: Summary;
}) {
  const tip = tooltipStyle();
  const funnelColors = [BLUE, BLUE, GOLD, EMERALD, EMERALD];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Analytics</h2>
        <p className="text-white/40 font-body text-sm">Hiring performance across all your postings</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Applicants", value: String(summary.totalApplicants), icon: Users,        accent: false },
          { label: "Hired",            value: String(summary.hired),            icon: CheckCircle2,  accent: true  },
          { label: "Conversion Rate",  value: `${summary.conversionRate}%`,     icon: TrendingUp,    accent: false },
          { label: "Active Postings",  value: String(summary.activePostings),   icon: Briefcase,     accent: false },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className={`rounded-2xl border p-5 ${accent ? "bg-emerald-500/[0.07] border-emerald-400/30" : "bg-white/[0.04] border-white/[0.08]"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accent ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-white/[0.08] border border-white/10"}`}>
              <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-emerald-400"}`} strokeWidth={1.75} />
            </div>
            <div className="font-display text-2xl text-white font-bold leading-none mb-1">{value}</div>
            <p className="text-white/45 font-body text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Hiring funnel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Hiring Funnel</h3>
        {funnel.every(f => f.count === 0) ? (
          <p className="text-white/30 font-body text-sm text-center py-12">No applicant data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="stage" stroke="rgba(255,255,255,0.5)" fontSize={12} width={90} />
              <Tooltip {...tip} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {funnel.map((_, i) => <Cell key={i} fill={funnelColors[i] ?? EMERALD} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications per posting */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-lg text-white mb-4">Applicants per Posting</h3>
          {perPosting.length === 0 ? (
            <p className="text-white/30 font-body text-sm text-center py-12">No postings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perPosting} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="title" stroke="rgba(255,255,255,0.4)" fontSize={10} angle={-20} textAnchor="end" height={60} interval={0} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} />
                <Tooltip {...tip} />
                <Bar dataKey="applicants" fill={GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Applications over time */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-lg text-white mb-4">Applications — Last 8 Weeks</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="applications" stroke={EMERALD} strokeWidth={2} dot={{ fill: EMERALD, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
