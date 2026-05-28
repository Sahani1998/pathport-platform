import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ApplicationWithCourse } from "@/types/courses";
import { APPLICATION_STATUSES } from "@/types/courses";
import { REQUIRED_DOC_TYPES } from "@/types/documents";
import { FileText, Building2, ChevronRight, BookOpen, CheckCircle2, XCircle, Upload } from "lucide-react";

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

// The happy-path statuses in order (rejected is off-path)
const TIMELINE_STEPS = APPLICATION_STATUSES.filter(s => s.value !== "rejected");

export default async function StudentApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  console.log("[Applications] loading student applications for:", user.id);

  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      courses (
        id, title, slug, category, level, tuition_fee, intake_date, status,
        colleges (id, name, slug)
      )
    `)
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[Applications] fetch error:", error.code, error.message);
  }

  const applications = (data ?? []) as ApplicationWithCourse[];

  // Fetch document upload counts for each application
  const { data: docCounts } = await supabase
    .from("student_documents")
    .select("application_id, document_type, status")
    .eq("student_id", user.id);

  // Build a map: applicationId → { uploaded: Set<docType>, verified: number }
  const docMap = new Map<string, { types: Set<string>; verified: number }>();
  for (const doc of docCounts ?? []) {
    if (!doc.application_id) continue;
    if (!docMap.has(doc.application_id)) docMap.set(doc.application_id, { types: new Set(), verified: 0 });
    const entry = docMap.get(doc.application_id)!;
    entry.types.add(doc.document_type);
    if (doc.status === "verified") entry.verified++;
  }

  const stats = {
    total:       applications.length,
    active:      applications.filter(a => !["approved","rejected"].includes(a.status)).length,
    approved:    applications.filter(a => a.status === "approved").length,
    offerReady:  applications.filter(a => a.status === "offer_ready").length,
  };

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">My Applications</h2>
          <p className="text-white/45 font-body text-sm">Track the status of all your Singapore college applications</p>
        </div>
        <Link href="/dashboard/student/courses">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/[0.14] transition-all">
            <BookOpen className="w-4 h-4" /> Browse Courses
          </div>
        </Link>
      </div>

      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",       value: stats.total,      color: "text-white" },
            { label: "In Progress", value: stats.active,     color: "text-pathBlue-400" },
            { label: "Offer Ready", value: stats.offerReady, color: "text-gold-400" },
            { label: "Approved",    value: stats.approved,   color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-center">
              <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-white/40 font-body text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-12 h-12 text-white/20 mb-4" />
          <p className="font-display text-2xl text-white/40 mb-1">No applications yet</p>
          <p className="text-white/30 font-body text-sm mb-6">Browse courses and click &ldquo;Apply Now&rdquo; to get started</p>
          <Link href="/dashboard/student/courses">
            <div className="px-5 py-3 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
              Browse Courses
            </div>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const statusMeta   = APPLICATION_STATUSES.find(s => s.value === app.status);
            const currentStep  = statusMeta?.step ?? 1;
            const isRejected   = app.status === "rejected";
            const isApproved   = app.status === "approved";

            return (
              <div key={app.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">

                {/* Card header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-pathBlue-400" />
                    </div>
                    <div>
                      <p className="text-white/40 font-body text-xs">{app.courses?.colleges?.name}</p>
                      <Link href={`/dashboard/student/courses/${app.courses?.slug}`} className="text-white/85 font-body font-semibold text-sm hover:text-gold-400 transition-colors">
                        {app.courses?.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 font-body text-[11px]">{app.courses?.category}</span>
                        <span className="text-white/20 font-body text-[11px]">·</span>
                        <span className="text-white/30 font-body text-[11px]">{app.courses?.level?.replace(/_/g, " ")}</span>
                        {app.courses?.tuition_fee && (
                          <>
                            <span className="text-white/20 font-body text-[11px]">·</span>
                            <span className="text-gold-400/70 font-body text-[11px] font-semibold">{fmtSGD(app.courses.tuition_fee)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-body text-xs font-semibold ${statusMeta?.color ?? ""}`}>
                      {isApproved  && <CheckCircle2 className="w-3 h-3" />}
                      {isRejected  && <XCircle      className="w-3 h-3" />}
                      {statusMeta?.label ?? app.status}
                    </span>
                    <Link href={`/dashboard/student/courses/${app.courses?.slug}`} className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Timeline */}
                {!isRejected && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center">
                      {TIMELINE_STEPS.map((step, i) => {
                        const isComplete = currentStep > step.step;
                        const isCurrent  = currentStep === step.step;
                        const isLast     = i === TIMELINE_STEPS.length - 1;

                        return (
                          <div key={step.value} className="flex items-center flex-1 min-w-0">
                            {/* Node */}
                            <div className="flex flex-col items-center flex-shrink-0" title={step.label}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isComplete
                                  ? "bg-emerald-500 border-emerald-400"
                                  : isCurrent
                                    ? "bg-gold-400 border-gold-300 ring-4 ring-gold-400/20"
                                    : "bg-white/[0.04] border-white/20"
                              }`}>
                                {isComplete && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <p className={`font-body text-[9px] mt-1 text-center max-w-[48px] leading-tight hidden sm:block ${
                                isCurrent ? "text-gold-400 font-semibold" : isComplete ? "text-emerald-400/70" : "text-white/20"
                              }`}>{step.label}</p>
                            </div>
                            {/* Connector */}
                            {!isLast && (
                              <div className={`h-0.5 flex-1 mx-0.5 ${isComplete ? "bg-emerald-500/50" : "bg-white/[0.08]"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes / rejection message */}
                {(app.notes || isRejected) && (
                  <div className={`px-5 pb-4`}>
                    <div className={`p-3 rounded-xl border font-body text-xs ${
                      isRejected
                        ? "bg-red-500/[0.06] border-red-400/20 text-red-300/70"
                        : "bg-white/[0.03] border-white/[0.07] text-white/45"
                    }`}>
                      {isRejected ? "Application not taken forward at this stage." : app.notes}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <p className="text-white/25 font-body text-xs">
                      Applied {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-white/25 font-body text-xs">
                      Updated {new Date(app.updated_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {/* Document summary */}
                  {(() => {
                    const docs     = docMap.get(app.id);
                    const uploaded = docs?.types.size ?? 0;
                    const required = REQUIRED_DOC_TYPES.length;
                    return (
                      <Link href="/dashboard/student/documents"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-body text-xs font-semibold transition-all ${
                          uploaded === 0
                            ? "bg-white/[0.04] border-white/[0.09] text-white/35 hover:border-gold-400/30 hover:text-gold-400"
                            : uploaded >= required
                              ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                              : "bg-gold-400/10 border-gold-400/25 text-gold-400"
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        {uploaded === 0 ? "Upload docs" : `Docs: ${uploaded}/${required}`}
                        {(docs?.verified ?? 0) > 0 && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        )}
                      </Link>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
