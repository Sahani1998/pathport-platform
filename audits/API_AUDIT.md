# API_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12 · 31 route files / 38 method handlers audited*

## 1. Baseline (all routes unless noted)
- ✅ Authentication: `supabase.auth.getUser()` + 401 on every route except 3 intentionally public (`/api/inquiries` POST, `/api/auth/check`, `/api/auth/resend-activation`)
- ✅ Authorization: role checks (admin/institution/student) + RLS scoping; ownership verified for student actions
- ✅ Rate limiting on every route **except one** (below)
- ✅ try/catch with correct status codes (400/401/403/404/409/429/500)
- ✅ Signed URLs (1h) for all storage downloads; admin client used only where buckets lack student policies

## 2. Route-level issues

### 🔴 Critical
| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | **In-memory rate limiter** — `Map` resets on every serverless cold start; limits are per-instance, trivially bypassed at scale | `src/lib/rate-limit.ts` | Upstash Redis (@upstash/ratelimit) |
| 2 | **No rate limit on DELETE /api/courses/[id]** | courses/[id]/route.ts | Add `checkRateLimit("courses-delete:…")` |

### 🟡 High
| # | Issue | Location |
|---|---|---|
| 3 | **Duplicate endpoints**: `/applications/[id]/status` (legacy, no email) vs `/applications/[id]/stage` (modern, full side effects). `StatusUpdateSelect` still calls legacy | both routes |
| 4 | **Legacy `/api/documents/[id]` PATCH** — updates document status with NO audit log, NO timeline, NO review history; coexists with modern `/review` POST | documents/[id]/route.ts |
| 5 | **Audit-logging gaps**: profile PATCH (passport/DOB changes), colleges PATCH/DELETE, courses writes — no audit entries | several |
| 6 | **Offer decision graceful degradation** — if admin client unavailable, decision saves but stage/timeline/audit silently skipped (returns `warning`) | offer-letters/[id]/decision |

### 🟢 Medium / Low
7. Inconsistent rate-limit values (colleges POST 10/min vs PATCH 20/min; list GETs 30 vs 60/min) — harmonize.
8. No URL-format validation on colleges.website; course slug case relies on DB constraint.
9. Partner approve route is 352 lines, 3 branching identity paths — works, but high complexity; extract helpers.
10. Emails are non-fatal fire-and-forget — correct choice, but there is no retry queue; failed emails are logged to email_log and never retried.

## 3. Strengths worth keeping
- Two-query pattern consistently used for auth.users FKs (no silent PostgREST join failures).
- 42P01 graceful handling lets the app run before migrations are applied.
- Storage uploads validate MIME + size and roll back storage objects on DB insert failure.
- Withdrawal, document review, IPA, offer decision, partner approval all write audit trails.
- `/api/auth/*` routes avoid email enumeration.

## 4. Unused / duplicate endpoint disposition
| Endpoint | Recommendation |
|---|---|
| `/api/applications/[id]/status` PATCH | Deprecate → migrate StatusUpdateSelect to `/stage`, then delete |
| `/api/documents/[id]` PATCH | Delete (review flow fully replaced it in sprint15 UI) |
| `/api/admin/test-email` | Keep (admin-gated diagnostics) |
