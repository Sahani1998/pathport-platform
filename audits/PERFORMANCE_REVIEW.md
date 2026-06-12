# PERFORMANCE_REVIEW.md — PathPort Platform
*Review date: 2026-06-12*

## Method
Static analysis of all server components and API routes. Checked for: N+1 query patterns, unpaginated queries on tables that will grow unboundedly, JS-side aggregation, and missing indexes.

---

## Critical — will degrade at scale

### P1 — Admin analytics: full-table scan + JS aggregation
**File:** `src/app/dashboard/admin/analytics/page.tsx`
**Pattern:** Fetches every applications row without LIMIT, then aggregates in JS:
```typescript
const { data: allApplications } = await supabase
  .from("applications")
  .select("id, status, current_stage, course_id, student_id");
// Then loops in JS to compute counts/rates
```
**Impact:** Fine at 1k rows; noticeable at 10k; breaks at 100k.
**Fix (Sprint 18):** Replace with SQL RPC or materialized view. Supabase supports `SELECT COUNT(*) ... GROUP BY stage` which runs server-side.

### P2 — Admin students: unpaginated full-table fetch
**File:** `src/app/dashboard/admin/students/page.tsx`
**Pattern:** Fetches all student profiles with no `range()` call.
**Impact:** Memory spike + slow page at 10k+ students.
**Fix (Sprint 18):** Add server-side pagination using the same `range(from, to)` pattern already used in institution/applications/page.tsx.

---

## Medium — acceptable now, monitor

### P3 — Institution dashboard: batch-loads all college applications for metrics
**File:** `src/app/dashboard/institution/page.tsx`
**Pattern:** Loads all applications for the institution's college to compute conversion metrics in JS.
**Impact:** Acceptable to ~10k applications per college. Beyond that, needs SQL aggregation.
**Fix (Sprint 18):** SQL-side aggregation via RPC.

### P4 — Two-query pattern used correctly (NOT a problem)
All pages that need student names alongside application data use the correct two-query pattern:
1. Fetch applications (joins auth.users via student_id foreign key)
2. Separately fetch profiles for the visible page of student IDs

This is the only safe pattern for FK references to auth.users given Supabase RLS constraints. Confirmed in: institution/applications, admin/applications, admin/students. Do not change this to a join.

---

## Low / informational

### P5 — Realtime refresh triggers full server re-render
**File:** `src/app/dashboard/student/applications/page.tsx` (RealtimeRefresher component)
**Pattern:** `router.refresh()` on every realtime event causes a full server component re-render.
**Impact:** Acceptable at current scale. At high traffic (>50 concurrent users receiving events), add debounce.
**Fix (Sprint 18 or later):** Debounce `router.refresh()` calls.

### P6 — Email sent synchronously in request handlers
**Pattern:** `sendTemplatedEmail()` is awaited inside API handlers (some) or fire-and-forget (most).
**Impact:** Non-fatal today — Resend latency adds ~200ms to response time. At bulk stage changes, Resend rate limit (10 rps) will throttle.
**Fix (Sprint 18):** Email retry queue (email_outbox table + Vercel cron drain).

---

## Good patterns confirmed (no action needed)

| Pattern | Location | Status |
|---|---|---|
| Server-side pagination | institution/applications | ✅ range() + count exact |
| Parallel data fetches | All dashboard pages | ✅ Promise.all() used throughout |
| Force-dynamic on realtime pages | student/applications | ✅ export const dynamic = "force-dynamic" |
| Signed URL downloads | documents, offer-letters | ✅ createSignedUrl with short TTL |
| No N+1 in admin applications | admin/applications/page.tsx | ✅ Batch student/course lookups |

---

## Summary

| Priority | Finding | Sprint |
|---|---|---|
| 🔴 High | Admin analytics full-table JS aggregation | Sprint 18 |
| 🔴 High | Admin students unpaginated | Sprint 18 |
| 🟡 Medium | Institution dashboard batch aggregation | Sprint 18 |
| 🟢 Low | Realtime refresh debounce | Sprint 18+ |
| 🟢 Low | Email queue | Sprint 18 |

No N+1 patterns found. Pagination exists and is used correctly where traffic is highest (institution applications list).
