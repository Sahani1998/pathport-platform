# SCALABILITY_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12*

## Readiness verdicts
| Scale | Verdict |
|---|---|
| **1,000 students** | ✅ READY — current architecture handles this comfortably |
| **10,000 students** | ⚠️ READY WITH FIXES — 4 changes required (below) |
| **100,000 students** | ❌ NOT READY — needs aggregation layer, queueing, and caching work |

## Findings by subsystem

### Database — GOOD foundation, full-scan hotspots
- All FK columns indexed (except `profiles.college_id` — add it).
- 🔴 **Admin analytics page** loads **every applications row** into JS and aggregates in-memory (`select id,status,current_stage,course_id,student_id` with no limit). Fine at 1k, slow at 10k, breaks at 100k. → Replace with SQL aggregation (RPC or materialized view refreshed on interval).
- 🔴 **Admin students page** fetches all student profiles unpaginated. → Add server-side pagination (pattern already exists in institution applications page).
- 🟡 Institution dashboard batch-loads all college applications for metric computation — acceptable to ~10k apps per college, then needs aggregates.
- 🟢 Institution applications list already paginated (range + count exact) — the model to copy.

### Rate limiting — BROKEN at scale
- In-memory Map per serverless instance: limits reset on cold start and don't share across instances. At high traffic this is effectively no rate limiting. → Upstash Redis (~30 lines of change, LIMITS registry already centralized).

### Realtime — OK
- 2 tables published, client subscriptions filtered by user/student id. Supabase free tier: 200 concurrent connections; Pro: 500+. At 10k students assume <5% concurrent → fine on Pro. `router.refresh()` per event causes full server re-render — acceptable; consider debounce at higher traffic.

### Email — needs a queue at scale
- Resend called synchronously inside request handlers (non-fatal, but latency adds up); failed sends logged to email_log and never retried. At 10k+ students with bulk stage changes, add: queue table + cron/edge-function drain + retry with backoff. Resend rate limits (~10 rps default) will throttle bursts.

### Storage — fine
- Per-file caps (10MB), private buckets, signed URLs. Supabase storage scales independently. No issues to 100k.

### Background jobs — none exist
- No cron, no workers. Needed by 10k: email retry drain, document-request deadline reminders, offer-letter expiry sweeps. pg_cron or Vercel cron both viable.

### Frontend/SSR — fine
- All dashboards are server components with parallel fetches; no client-side waterfalls; force-dynamic where needed. Vercel scales horizontally.

## Priority fixes for the 10k milestone
1. Upstash Redis rate limiting
2. SQL-side aggregation for admin analytics + institution dashboard metrics
3. Pagination on admin students (+ any unpaginated admin lists)
4. Email retry queue + cron drain
5. `profiles.college_id` index

## Scalability score: 55/100
Excellent schema and query discipline at the row level; held back by in-memory rate limiting, JS-side aggregation on admin surfaces, no job/queue infrastructure, and unpaginated admin lists.
