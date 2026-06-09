import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplicationTimeline from "@/components/applications/ApplicationTimeline";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import StudentOfferLetterCard from "@/components/offer-letters/StudentOfferLetterCard";
import type { ApplicationWithCourse } from "@/types/courses";
import type { ApplicationTimelineEvent, ApplicationStage } from "@/types/timeline";
import type { OfferLetter } from "@/types/offer-letters";
import { REQUIRED_DOC_TYPES } from "@/types/documents";
import {
  FileText, Building2, BookOpen, CheckCircle2, XCircle,
  Upload, Bell,
} from "lucide-react";
import WithdrawButton from "@/components/applications/WithdrawButton";

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

type AppWithStage = ApplicationWithCourse & {
  current_stage:   ApplicationStage | null;
  stage_updated_at: string | null;
  next_action:     string | null;
  student_message: string | null;
};

export default async function StudentApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  console.log("[Applications] loading student applications for:", user.id);

  const [{ data, error }, { data: docCounts }, { data: events }, { data: offerLetterRows }] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        *,
        courses (
          id, title, slug, category, level, tuition_fee, intake_date, status,
          colleges (id, name, slug)
        )
      `)
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false }),

    supabase
      .from("student_documents")
      .select("application_id, document_type, status")
      .eq("student_id", user.id),

    supabase
      .from("application_timeline_events")
      .select("*")
      .eq("visible_to_student", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("offer_letters")
      .select("id, application_id, version, file_name, file_size, expiry_date, created_at, updated_at, notes, file_path, uploaded_by")
      .order("version", { ascending: false }),
  ]);

  if (error) console.error("[Applications] fetch error:", error.code, error.message);

  const applications = (data ?? []) as AppWithStage[];

  // Document map
  const docMap = new Map<string, { types: Set<string>; verified: number }>();
  for (const doc of docCounts ?? []) {
    if (!doc.application_id) continue;
    if (!docMap.has(doc.application_id)) docMap.set(doc.application_id, { types: new Set(), verified: 0 });
    const entry = docMap.get(doc.application_id)!;
    entry.types.add(doc.document_type);
    if (doc.status === "verified") entry.verified++;
  }

  // Offer letters map: applicationId → sorted letters (RLS ensures student-own)
  const offerLettersMap = new Map<string, OfferLetter[]>();
  for (const ol of (offerLetterRows ?? []) as OfferLetter[]) {
    if (!offerLettersMap.has(ol.application_id)) offerLettersMap.set(ol.application_id, []);
    offerLettersMap.get(ol.application_id)!.push(ol);
  }

  // Timeline events map
  const eventsMap = new Map<string, ApplicationTimelineEvent[]>();
  for (const evt of (events ?? []) as ApplicationTimelineEvent[]) {
    if (!eventsMap.has(evt.application_id)) eventsMap.set(evt.application_id, []);
    eventsMap.get(evt.application_id)!.push(evt);
  }

  const stats = {
    total:    applications.length,
    active:   applications.filter(a => !["approved","rejected","arrived_singapore"].includes(a.current_stage ?? a.status)).length,
    approved: applications.filter(a => ["approved","arrived_singapore"].includes(a.current_stage ?? a.status)).length,
  };

  // Unread notification count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">My Applications</h2>
          <p className="text-white/45 font-body text-sm">
            Track your full Singapore college journey — from application to arrival
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(unreadCount ?? 0) > 0 && (
            <Link href="/dashboard/student/notifications">
              <div className="relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/20 transition-all">
                <Bell className="w-3.5 h-3.5" />
                {unreadCount} new
              </div>
            </Link>
          )}
          <Link href="/dashboard/student/courses">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/[0.14] transition-all">
              <BookOpen className="w-4 h-4" /> Browse Courses
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Applications", value: stats.total,    color: "text-white" },
            { label: "In Progress",  value: stats.active,   color: "text-pathBlue-400" },
            { label: "Approved",     value: stats.approved, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-center">
              <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-white/40 font-body text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {applications.length === 0 && (
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
      )}

      {/* Application cards */}
      {applications.map((app) => {
        const currentStage  = (app.current_stage ?? "application_submitted") as ApplicationStage;
        const isRejected    = ["rejected", "withdrawn"].includes(currentStage);
        const isApproved    = ["approved", "arrived_singapore"].includes(currentStage);
        const canWithdraw   = !isRejected && !isApproved && !["ipa_processing", "offer_letter_ready", "fee_payment_pending"].includes(currentStage);
        const appEvents     = eventsMap.get(app.id) ?? [];
        const appOfferLetters = offerLettersMap.get(app.id) ?? [];
        const docs          = docMap.get(app.id);
        const uploaded      = docs?.types.size ?? 0;
        const reqTotal      = REQUIRED_DOC_TYPES.length;
        const course        = Array.isArray(app.courses) ? app.courses[0] : app.courses;
        const college       = course ? (Array.isArray(course.colleges) ? course.colleges[0] : course.colleges) : null;

        return (
          <div key={app.id} className={`bg-white/[0.04] border rounded-2xl overflow-hidden ${
            isApproved ? "border-emerald-400/20" : isRejected ? "border-red-400/15" : "border-white/[0.08]"
          }`}>

            {/* Card header */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-pathBlue-400" />
                </div>
                <div>
                  <p className="text-white/40 font-body text-xs">{college?.name ?? "—"}</p>
                  <Link href={`/dashboard/student/courses/${course?.slug ?? ""}`} className="text-white/85 font-body font-semibold text-sm hover:text-gold-400 transition-colors">
                    {course?.title ?? "—"}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-white/30 font-body text-[11px]">{course?.category}</span>
                    {course?.tuition_fee && (
                      <span className="text-gold-400/70 font-body text-[11px] font-semibold">{fmtSGD(course.tuition_fee)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                <ApplicationStageBadge stage={currentStage} />
                {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isRejected && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>

            {/* Timeline */}
            <div className="px-5 pb-3">
              <ApplicationTimeline
                currentStage={currentStage}
                events={appEvents}
                nextAction={app.next_action}
                studentMessage={app.student_message}
              />
            </div>

            {/* Offer letter card — only when letters exist */}
            {appOfferLetters.length > 0 && (
              <div className="px-5 pb-4">
                <StudentOfferLetterCard letters={appOfferLetters} />
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-white/25 font-body text-xs">
                  Applied {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {app.stage_updated_at && (
                  <p className="text-white/25 font-body text-xs">
                    Updated {new Date(app.stage_updated_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                  </p>
                )}
                {canWithdraw && (
                  <WithdrawButton
                    applicationId={app.id}
                    courseName={course?.title ?? "this course"}
                  />
                )}
              </div>
              {/* Document summary */}
              <Link href="/dashboard/student/documents"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-body text-xs font-semibold transition-all ${
                  uploaded === 0
                    ? "bg-white/[0.04] border-white/[0.09] text-white/35 hover:border-gold-400/30 hover:text-gold-400"
                    : uploaded >= reqTotal
                      ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                      : "bg-gold-400/10 border-gold-400/25 text-gold-400"
                }`}
              >
                <Upload className="w-3 h-3" />
                {uploaded === 0 ? "Upload docs" : `Docs: ${uploaded}/${reqTotal}`}
                {(docs?.verified ?? 0) > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
