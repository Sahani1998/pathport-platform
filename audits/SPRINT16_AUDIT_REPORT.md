# SPRINT16_AUDIT_REPORT.md — Verification of Audit Findings
*Audit date: 2026-06-12 · Code verified at: main @ dd4cf65*

## Purpose
Verify every finding from the 11 master audit files against current code before modifying anything.
All findings are confirmed unless marked otherwise.

---

## DUPLICATION AUDIT — VERIFIED

### D1 — Two application status systems ✅ CONFIRMED
- `ApplicationStatus` (7 values) in `src/types/courses.ts` — alive, still exported
- `ApplicationStage` (21 values) in `src/types/timeline.ts` — modern system
- `StatusUpdateSelect` imports `ApplicationStatus` + calls `/api/applications/[id]/status`
- **Action:** Migrate StatusUpdateSelect to ApplicationStage + `/stage` endpoint

### D2 — Duplicate stage-update endpoints ✅ CONFIRMED
- `src/app/api/applications/[id]/status/route.ts` — EXISTS; updates stage but sends NO email; no audit log
- `src/app/api/applications/[id]/stage/route.ts` — full pipeline (timeline + notification + email)
- **Action:** Delete `/status` route after D1

### D3 — Helper bypass (inline re-implementation) ✅ CONFIRMED
- `src/app/api/offer-letters/route.ts` POST: inline applications.update + timeline insert + audit insert + notifications insert
- `src/app/api/documents/[id]/review/route.ts` POST: inline notifications.insert + timeline insert + audit insert
- `src/app/api/applications/[id]/stage/route.ts` PATCH: inline timeline insert + notifications insert; **missing audit log** (D3 also reveals a gap)
- **Action:** Refactor all three to use `recordTimelineEvent`, `notifyUser`, `logAudit`, `advanceApplicationStage` helpers

### D4 — Legacy document status endpoint ✅ CONFIRMED
- `src/app/api/documents/[id]/route.ts` — PATCH only; updates student_documents with NO audit, NO timeline, NO review record
- No GET handler in this file; the review route is `/review` POST
- **Action:** Delete the file

### Unused code ✅ CONFIRMED
- `canTransition()` + `ALLOWED_TRANSITIONS` in `application-workflow.ts` — defined, never enforced anywhere
- `sendWelcomeEmail()` in `src/lib/email/send.ts` — defined but never imported or called anywhere else
- **Action:** Wire `canTransition()` into `/stage` route; delete `sendWelcomeEmail`

---

## SECURITY AUDIT — VERIFIED

### Rate limiting ✅ CONFIRMED
- In-memory Map backend in `src/lib/rate-limit.ts` — resets on cold start, no cross-instance sharing
- `DELETE /api/courses/[id]` — has NO rate limit call (PATCH has one, DELETE does not)
- **Action:** Add Upstash Redis backend (conditional on env vars); add coursesDelete to LIMITS; add rate limit to DELETE handler

### CSP ✅ CONFIRMED
- `next.config.js` CSP: no `frame-src` → YouTube/Vimeo embeds blocked
- `img-src` lists `images.unsplash.com` + `ui-avatars.com` but NOT `*.supabase.co` → storage images blocked on course pages
- `script-src` has `unsafe-eval` (needed for Next.js dev mode; acceptable)
- **Action:** Add `frame-src`, add `*.supabase.co` to `img-src`

### Missing audit logging ✅ CONFIRMED
- Profile writes, college writes, course writes: no per-write audit logging
- Application pipeline: well-covered by `application_audit_log`
- **Action:** Add structured server-side logging to profile/college/course write routes; profiles.college_id index via SQL

---

## DASHBOARD AUDIT — VERIFIED

### Broken sidebar links ✅ CONFIRMED
Sidebar.tsx partner nav has 3 non-existent links:
- `/dashboard/partner/candidates` — 404
- `/dashboard/partner/placements` — 404
- `/dashboard/partner/reports` — 404

Sidebar.tsx employer nav has 3 non-existent links:
- `/dashboard/employer/requests` — 404
- `/dashboard/employer/interns` — 404
- `/dashboard/employer/reports` — 404

**Action:** Remove all 6 broken links from NAV_ITEMS

### Fake data dashboards ✅ CONFIRMED
- `src/app/dashboard/partner/page.tsx`: `MY_CANDIDATES` array (5 fake records) + `COMMISSION_LOG` (4 fake records) rendered to real activated partner accounts
- `src/app/dashboard/employer/page.tsx`: `ACTIVE_INTERNS` (3 fake records) + `PENDING_REQUESTS` + `HIRE_HISTORY` rendered to real accounts
- Both pages have `// PREVIEW MODE: role guard temporarily disabled` comments
- **Action:** Replace with honest "portal under preparation" state; restore role guards

---

## SCALABILITY AUDIT — VERIFIED

### DB index ✅ CONFIRMED
- `profiles.college_id` FK column has no index — missing from all SQL files
- **Action:** Add via `sprint16_hardening.sql`

### In-memory rate limiting ✅ CONFIRMED (covered above)

---

## SUPABASE AUDIT — PARTIALLY VERIFIABLE FROM CODE

Sprint 13/14/15 SQL files exist in `src/lib/supabase/` — whether they've been run in the live project can only be confirmed via Supabase dashboard. Code handles missing tables gracefully via 42P01. Verification report is a separate deliverable.

---

## Summary of actions for Sprint 16

| # | Action | Files |
|---|---|---|
| 1 | Migrate StatusUpdateSelect → /stage | StatusUpdateSelect.tsx, institution/applications/page.tsx |
| 2 | Delete /status route | api/applications/[id]/status/route.ts |
| 3 | Delete legacy PATCH | api/documents/[id]/route.ts |
| 4 | Refactor stage route (helpers + canTransition + audit) | api/applications/[id]/stage/route.ts |
| 5 | Refactor offer-letters POST (advanceApplicationStage) | api/offer-letters/route.ts |
| 6 | Refactor document review POST (helpers) | api/documents/[id]/review/route.ts |
| 7 | Delete sendWelcomeEmail | lib/email/send.ts |
| 8 | Upstash Redis backend + coursesDelete limit | lib/rate-limit.ts |
| 9 | Add DELETE rate limit | api/courses/[id]/route.ts |
| 10 | Fix CSP | next.config.js |
| 11 | Remove broken partner/employer sidebar links | components/dashboard/Sidebar.tsx |
| 12 | Replace fake partner dashboard | dashboard/partner/page.tsx |
| 13 | Replace fake employer dashboard | dashboard/employer/page.tsx |
| 14 | profiles.college_id index | sprint16_hardening.sql |
