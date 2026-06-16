import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentsClient from "./DocumentsClient";
import type { AppRow, DocWithReviews, CollegeDocRow, OfferLetterRow } from "./DocumentsClient";
import type { StudentDocument, DocumentReview } from "@/types/documents";
import type { DocumentRequest } from "@/types/application-processing";

export const dynamic = "force-dynamic";

// Server component — all data is fetched here with explicit error capture, so
// the route either renders content, an empty state, or a visible error card.
// No client-side auth round-trip, no unresolvable loading state.
export default async function StudentDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const queryErrors: string[] = [];

  // ── Applications + own uploaded documents ─────────────────────────────────
  const [appsRes, docsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, courses(id, title, colleges(name))")
      .eq("student_id", user.id)
      .not("status", "eq", "rejected")
      .order("submitted_at", { ascending: false }),
    supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", user.id)
      .eq("is_active",  true)
      .order("uploaded_at", { ascending: false }),
  ]);

  if (appsRes.error) {
    console.error("[StudentDocuments] applications query failed:", appsRes.error);
    queryErrors.push(`Could not load your applications: ${appsRes.error.message}`);
  }
  if (docsRes.error) {
    console.error("[StudentDocuments] student_documents query failed:", docsRes.error);
    queryErrors.push(`Could not load your uploaded documents: ${docsRes.error.message}`);
  }

  type RawApp = {
    id:      string;
    status:  string;
    courses: { id: string; title: string; colleges: { name: string } | { name: string }[] | null } |
             { id: string; title: string; colleges: { name: string } | { name: string }[] | null }[] |
             null;
  };

  const courseTitleByApp = new Map<string, string>();

  const applications: AppRow[] = ((appsRes.data ?? []) as RawApp[]).map((app) => {
    const c   = Array.isArray(app.courses) ? app.courses[0] : app.courses;
    const col = Array.isArray(c?.colleges) ? c.colleges[0]  : c?.colleges;
    const courseTitle = c?.title ?? "Unknown course";
    courseTitleByApp.set(app.id, courseTitle);
    return {
      id:          app.id,
      status:      app.status,
      courseTitle,
      collegeName: (col as { name?: string } | null)?.name ?? "Unknown college",
    };
  });

  const rawDocs = (docsRes.data ?? []) as StudentDocument[];
  const docIds  = rawDocs.map(d => d.id);
  const appIds  = applications.map(a => a.id);

  // ── Reviews, reviewer names, offer letters, college documents ─────────────
  //
  // document_reviews.reviewer_id and offer_letters.uploaded_by reference
  // auth.users(id), NOT profiles(id) — PostgREST implicit joins fail there.
  // Two-query pattern: fetch rows first, then batch-fetch reviewer profiles.
  //
  const [reviewsRes, offersRes, collegeDocsRes, docRequestsRes] = await Promise.all([
    docIds.length > 0
      ? supabase
          .from("document_reviews")
          .select("id, document_id, reviewer_id, status, comment, created_at")
          .in("document_id", docIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    appIds.length > 0
      ? supabase
          .from("offer_letters")
          .select("id, application_id, file_name, version, expiry_date, created_at")
          .in("application_id", appIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("student_downloadable_documents")
      .select("id, application_id, title, file_name, file_size, document_type, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_requests")
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (reviewsRes.error) {
    console.error("[StudentDocuments] document_reviews query failed:", reviewsRes.error);
    queryErrors.push(`Could not load review results: ${reviewsRes.error.message}`);
  }
  if (offersRes.error) {
    console.error("[StudentDocuments] offer_letters query failed:", offersRes.error);
    queryErrors.push(`Could not load offer letters: ${offersRes.error.message}`);
  }
  if (collegeDocsRes.error) {
    // 42P01 = relation does not exist → migration not applied yet; render the
    // section empty rather than blocking the whole page.
    if (collegeDocsRes.error.code === "42P01") {
      console.warn("[StudentDocuments] student_downloadable_documents table missing — run sprint13_college_documents.sql");
    } else {
      console.error("[StudentDocuments] college documents query failed:", collegeDocsRes.error);
      queryErrors.push(`Could not load college documents: ${collegeDocsRes.error.message}`);
    }
  }
  if (docRequestsRes.error) {
    if (docRequestsRes.error.code === "42P01") {
      console.warn("[StudentDocuments] document_requests table missing — run sprint15_application_processing.sql");
    } else {
      console.error("[StudentDocuments] document requests query failed:", docRequestsRes.error);
      queryErrors.push(`Could not load document requests: ${docRequestsRes.error.message}`);
    }
  }

  // Reviewer names (best-effort — profiles RLS may hide them from students)
  type RawReview = { id: string; document_id: string; reviewer_id: string | null; status: string; comment: string | null; created_at: string };
  const rawReviews   = (reviewsRes.data ?? []) as RawReview[];
  const reviewerIds  = Array.from(new Set(rawReviews.map(r => r.reviewer_id).filter((v): v is string => !!v)));
  const reviewerName = new Map<string, string | null>();

  if (reviewerIds.length > 0) {
    const { data: reviewerProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reviewerIds);
    for (const p of (reviewerProfiles ?? []) as { id: string; full_name: string | null }[]) {
      reviewerName.set(p.id, p.full_name);
    }
  }

  const reviewsByDoc = new Map<string, DocumentReview[]>();
  for (const r of rawReviews) {
    const review: DocumentReview = {
      id:          r.id,
      document_id: r.document_id,
      reviewer_id: r.reviewer_id,
      status:      r.status as DocumentReview["status"],
      comment:     r.comment,
      created_at:  r.created_at,
      reviewer:    r.reviewer_id
        ? { full_name: reviewerName.get(r.reviewer_id) ?? null }
        : null,
    };
    const bucket = reviewsByDoc.get(review.document_id) ?? [];
    bucket.push(review);
    reviewsByDoc.set(review.document_id, bucket);
  }

  const documents: DocWithReviews[] = rawDocs.map(d => ({
    ...d,
    reviews: reviewsByDoc.get(d.id) ?? [],
  }));

  type RawOffer = { id: string; application_id: string; file_name: string; version: number; expiry_date: string | null; created_at: string };
  const offerLetters: OfferLetterRow[] = ((offersRes.data ?? []) as RawOffer[]).map(o => ({
    id:          o.id,
    file_name:   o.file_name,
    version:     o.version,
    expiry_date: o.expiry_date,
    created_at:  o.created_at,
    courseTitle: courseTitleByApp.get(o.application_id) ?? null,
  }));

  type RawCollegeDoc = { id: string; application_id: string | null; title: string; file_name: string; file_size: number | null; document_type: string; created_at: string };
  const collegeDocs: CollegeDocRow[] = ((collegeDocsRes.data ?? []) as RawCollegeDoc[]).map(d => ({
    id:            d.id,
    title:         d.title,
    file_name:     d.file_name,
    file_size:     d.file_size,
    document_type: d.document_type,
    created_at:    d.created_at,
    courseTitle:   d.application_id ? (courseTitleByApp.get(d.application_id) ?? null) : null,
  }));

  const pendingRequests = (docRequestsRes.data ?? []) as DocumentRequest[];

  return (
    <DocumentsClient
      userId={user.id}
      applications={applications}
      documents={documents}
      collegeDocs={collegeDocs}
      offerLetters={offerLetters}
      pendingRequests={pendingRequests}
      queryErrors={queryErrors}
    />
  );
}
