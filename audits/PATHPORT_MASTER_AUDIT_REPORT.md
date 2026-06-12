# PATHPORT MASTER AUDIT REPORT
*Audit date: 2026-06-12 · Codebase: main @ dd4cf65 · 63 routes, 19 tables, 31 API route files, 16 SQL files*
*Companion reports: DATABASE / AUTH / APPLICATION_WORKFLOW / DASHBOARD / API / SECURITY / SUPABASE / VERCEL / DUPLICATION / SCALABILITY audit files in this folder.*

---

## 1. COMPLETED ✅
- **Student portal** (8/10 pages fully real-data): dashboard, applications with timeline + progress + realtime, course browser + detail, documents (upload/review/requests/downloadables), notifications, profile + education
- **Institution portal** (8/9): dashboard metrics, applications (search/pagination/detail with doc-requests/notes/IPA panels), students roster, document review queue, course CRUD, notifications
- **Admin portal** (16/16): console, inquiries, students, applications, colleges, courses, documents, offer letters, partner approval pipeline, analytics command center, notifications, diagnostics, settings
- **Authentication**: signup, email verify, partner activation, password reset (fixed in PRs #25/#26), login/logout, role routing, middleware protection
- **Application engine**: inquiry → application → documents → review → requests (auto-fulfil trigger) → offer letter → accept/decline → IPA → approval, with timeline + notifications + audit + 20 email templates
- **Security baseline**: full RLS (19/19 tables), security headers + CSP, rate limiting on 37/38 handlers, signed-URL downloads, service-role key server-only
- **Email system**: single send path, email_log tracking, stage-specific template routing

## 2. PARTIALLY COMPLETED ⚠️
| Item | Gap |
|---|---|
| Fee payment | Stage + email exist; no payment record/receipt/mark-paid module |
| Arrival services | Stage exists; student page is a static hardcoded checklist |
| Enrollment | Stage + email exist; no enrollment confirmation record |
| Internships | Stage exists; student page is "Coming Soon" |
| Institution reports | "Coming Soon" placeholder |
| Stage transition rules | ALLOWED_TRANSITIONS defined but never enforced |

## 3. BROKEN 🔴
1. **6 broken sidebar links** — partner nav (candidates/placements/reports) and employer nav (requests/interns/reports) point to pages that don't exist → 404
2. **Partner + employer dashboards show hardcoded fake data** to real activated accounts (MY_CANDIDATES, ACTIVE_INTERNS arrays)
3. **CSP blocks YouTube/Vimeo embeds** (no frame-src) and likely Supabase-storage images (img-src missing *.supabase.co) on course pages

## 4. DUPLICATED 🟡
1. Two status systems: `ApplicationStatus` (legacy 7) vs `ApplicationStage` (modern 21) + lossy reverse mapping
2. `/api/applications/[id]/status` vs `/stage` — legacy route sends no email; StatusUpdateSelect still uses it
3. `/api/documents/[id]` PATCH (no audit) vs `/review` POST (full trail)
4. Timeline/notification/audit logic re-implemented inline in 3 routes instead of using `advanceApplicationStage()` helpers
5. Unused: `canTransition()`, possibly `sendWelcomeEmail()`

## 5. MISSING ❌
- Payment recording module · arrival checklist data model · enrollment records · internship module (or removal of those nav stubs)
- Partner/employer portal real pages (or hide nav until built — note: previously declared out of scope)
- Redis-backed rate limiting · email retry queue · cron jobs · error monitoring (Sentry) · admin MFA
- SQL aggregation for admin analytics · pagination on admin students
- `profiles.college_id` index

## 6. SQL MIGRATIONS TO VERIFY/RUN (Supabase SQL Editor)
1. `sprint13_college_documents.sql` — if student "Documents from your college" section is empty-by-error
2. `sprint14_security_hardening.sql` — partner self-read + institution-read-applicants policies
3. `sprint15_application_processing.sql` — document_requests, application_notes, ipa_records, offer decision columns, realtime
4. Recommended addition: `CREATE INDEX profiles_college_id_idx ON public.profiles(college_id);`
All are idempotent — safe to re-run.

## 7. SUPABASE MANUAL ACTIONS
1. Redirect URL allowlist: add `/reset-password` on BOTH Vercel domains (root cause of recurring reset bug)
2. Set Site URL to canonical production domain
3. Verify `ipa-documents` bucket exists (private, PDF, 10MB)
4. Verify `applications` + `notifications` in supabase_realtime publication
5. (Later) Enable TOTP MFA for admin accounts

## 8. VERCEL MANUAL ACTIONS
1. Confirm all 6 env vars set for Production AND Preview
2. Consolidate to one canonical domain (custom domain recommended); update Site URL + NEXT_PUBLIC_SITE_URL
3. Consider Deployment Protection on previews (they share the production database)
4. Add error monitoring integration

## 9–12. SCORES
| Dimension | Score | Rationale |
|---|---|---|
| **Security** | **78/100** | Full RLS, headers, signed URLs, server-only service key; −rate-limit resets, −no MFA, −CSP gaps, −audit-log holes |
| **Production readiness** | **74/100** | Core pipeline complete and deployed; −broken partner/employer nav, −fake-data dashboards, −pending SQL verification, −no monitoring |
| **Scalability** | **55/100** | Indexed schema + pagination patterns exist; −in-memory rate limit, −JS-side aggregation, −no queue/cron, −unpaginated admin lists |
| **Technical debt** | **70/100** (higher = cleaner) | One workflow brain + one email path; −dual status system, −3 helper bypasses, −2 legacy endpoints, −dead code |

---

## RECOMMENDED SPRINTS (gap-driven)

### SPRINT 16 — Consolidation & Production Hardening (no new features)
1. Retire legacy status path: migrate StatusUpdateSelect → `/stage`, delete `/api/applications/[id]/status` + `/api/documents/[id]` PATCH
2. Refactor offer-letters POST, documents review, stage route onto `advanceApplicationStage()`/helpers; enforce `canTransition()` in `/stage`
3. Upstash Redis rate limiting (replace in-memory Map)
4. Fix CSP: add frame-src (YouTube/Vimeo) + img-src (*.supabase.co); drop unsafe-eval if build allows
5. Add missing rate limit (courses DELETE), audit logging for profile/college/course writes, `profiles.college_id` index
6. Broken-nav triage: remove partner/employer sidebar links to non-existent pages; replace mock-data dashboards with honest "portal being prepared" states (zero fake data)
7. Run/verify sprint13/14/15 SQL + Supabase auth config checklist

### SPRINT 17 — Complete the Post-Approval Journey
1. **Fee payment module**: payments table (amount, currency, receipt upload, status), institution mark-received, student receipt view, stage auto-advance
2. **Arrival services**: arrival_checklists table replacing the static page; institution/admin manage items; student checks off; flight/accommodation details
3. **Enrollment completion**: enrollment record (date, student ID at college), stage auto-advance, completion certificate of the journey
4. Document-request deadline reminder emails (first cron job — Vercel cron)

### SPRINT 18 — Scale & Insight
1. SQL-side aggregation (RPCs/materialized views) for admin analytics + institution dashboard
2. Institution reports page (real): intake conversion, processing-time trends, document turnaround — replacing "Coming Soon"
3. Pagination for admin students + remaining unpaginated admin lists
4. Email retry queue (email_outbox table + cron drain + backoff)
5. Error monitoring (Sentry) + admin MFA rollout

*Deliberately excluded per standing constraints: employer portal, recruitment partner portal, AI chatbot, mobile app, multi-country. If partner/employer portals are re-prioritized, that becomes its own sprint after 16.*
