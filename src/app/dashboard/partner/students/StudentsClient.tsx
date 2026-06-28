"use client";

import { useState, useMemo } from "react";
import { Users, Search, MapPin, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";

export interface PartnerStudent {
  id: string;
  referred_at: string;
  notes: string | null;
  student: {
    id: string;
    full_name: string | null;
    email: string;
    country: string | null;
    phone: string | null;
    created_at: string;
  };
  app_count: number;
  approved_count: number;
}

interface Props {
  initialRows: PartnerStudent[];
}

export default function StudentsClient({ initialRows }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return initialRows;
    return initialRows.filter(r =>
      (r.student.full_name ?? "").toLowerCase().includes(q) ||
      r.student.email.toLowerCase().includes(q) ||
      (r.student.country ?? "").toLowerCase().includes(q)
    );
  }, [initialRows, search]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
            <Users className="w-7 h-7 text-gold-400" />
            My Students
          </h2>
          <p className="text-white/45 font-body text-sm">
            {initialRows.length} student{initialRows.length !== 1 ? "s" : ""} in your network
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 max-w-sm">
        <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-white/70 placeholder-white/25 font-body text-sm flex-1 min-w-0 focus:outline-none"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 flex flex-col items-center text-center gap-4">
          <Users className="w-10 h-10 text-white/20" />
          <div>
            <p className="font-display text-xl text-white/40 mb-1">
              {search ? "No students found" : "No students yet"}
            </p>
            <p className="text-white/25 font-body text-sm">
              {search ? "Try a different search term" : "Contact your PathPort manager to link students to your account"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.07] text-white/30 font-body text-xs uppercase tracking-wider">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-2">Country</div>
            <div className="col-span-2 text-center">Applications</div>
            <div className="col-span-1 text-right">Referred</div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {filtered.map(row => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                {/* Avatar + name */}
                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-sm">
                    {(row.student.full_name?.trim()?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-white/85 truncate">{row.student.full_name ?? "—"}</p>
                    <p className="font-body text-xs text-white/40 truncate">{row.student.email}</p>
                  </div>
                </div>
                {/* Contact */}
                <div className="md:col-span-3 flex flex-col justify-center gap-1">
                  <p className="font-body text-xs text-white/50 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{row.student.email}</span>
                  </p>
                  {row.student.phone && (
                    <p className="font-body text-xs text-white/50 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {row.student.phone}
                    </p>
                  )}
                </div>
                {/* Country */}
                <div className="md:col-span-2 flex items-center">
                  <p className="font-body text-sm text-white/60 flex items-center gap-1.5">
                    {row.student.country && <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />}
                    {row.student.country ?? "—"}
                  </p>
                </div>
                {/* Application counts */}
                <div className="md:col-span-2 flex items-center md:justify-center gap-3">
                  <span className="flex items-center gap-1 font-body text-sm text-white/60">
                    <FileText className="w-3.5 h-3.5 text-white/30" />
                    {row.app_count}
                  </span>
                  {row.approved_count > 0 && (
                    <span className="flex items-center gap-1 font-body text-sm text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {row.approved_count}
                    </span>
                  )}
                </div>
                {/* Referred date */}
                <div className="md:col-span-1 flex items-center md:justify-end">
                  <p className="text-white/30 font-body text-xs">
                    {new Date(row.referred_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
