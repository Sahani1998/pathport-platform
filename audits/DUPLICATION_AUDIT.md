# DUPLICATION_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12*

## 1. Confirmed duplication (action needed)

### 🟡 D1 — Two application status systems
- **Modern**: `ApplicationStage` (21 values) in `src/types/timeline.ts`, metadata + progress + emails centralized in `src/lib/application-workflow.ts` ✅ single source of truth
- **Legacy**: `ApplicationStatus` (7 values) in `src/types/courses.ts` + `APPLICATION_STATUSES` metadata + DB column `applications.status` with check constraint
- Bridge: `src/lib/application-stage-mapping.ts` (STAGE_TO_STATUS lossless, STATUS_TO_STAGE **lossy** — `under_review` → 3 possible stages)
- **Consumer of legacy**: `src/components/courses/StatusUpdateSelect.tsx` → `/api/applications/[id]/status`
- **Consolidation**: migrate StatusUpdateSelect to stage values + `/stage` endpoint; mark `ApplicationStatus` deprecated; keep DB column only as a denormalized sync target until a column-drop migration.

### 🟡 D2 — Duplicate stage-update endpoints with asymmetric behaviour
- `/api/applications/[id]/stage` — timeline + notification + audit + **stage-specific email** ✅
- `/api/applications/[id]/status` — timeline + notification + audit, **no email** ❌
- **Fix**: deprecate `/status` after D1.

### 🟡 D3 — Side-effect logic re-implemented inline (helper bypass)
`src/lib/application-timeline.ts` provides `recordTimelineEvent` / `notifyUser` / `logAudit` / `advanceApplicationStage`, but:
- `/api/offer-letters` POST re-implements all four inline (manual stage update + manual inserts)
- `/api/documents/[id]/review` re-implements timeline/notification/audit inline
- `/api/applications/[id]/stage` implements inline (predates helper)
- **Fix**: refactor all three to call the helpers — one behaviour, one place.

### 🟡 D4 — Legacy document status endpoint
- `/api/documents/[id]` PATCH (no audit, no history) duplicates `/api/documents/[id]/review` POST (full trail). UI now uses `/review` only. **Fix**: delete the PATCH handler.

## 2. Not duplicates (verified, keep as-is)
| Pair | Verdict |
|---|---|
| DocumentReviewActions vs DocumentReviewPanel | Different UX contexts (inline list vs detail page) |
| LoginForm vs AdminLoginForm | Different auth flows (role-aware vs admin-strict) |
| Badge vs ApplicationStageBadge vs DocumentStatusBadge | Generic vs domain metadata |
| student_documents vs student_downloadable_documents | Opposite directions, different buckets |
| document_reviews vs document_requests | Feedback vs solicitation |
| timeline_events vs audit_log | Student-facing vs compliance |

## 3. Unused code
| Item | Location | Action |
|---|---|---|
| `canTransition()` + `ALLOWED_TRANSITIONS` | application-workflow.ts | Never enforced anywhere — either wire into `/stage` route validation (recommended) or delete |
| `sendWelcomeEmail()` | email/send.ts | Verify usage; remove if dead |
| Legacy `/api/documents/[id]` PATCH | route file | Delete after confirming no client calls |

## 4. Single sources of truth (healthy)
- Email sending: only `sendTemplatedEmail()` touches Resend; all sends logged to email_log ✅
- Stage metadata/progress/emails: application-workflow.ts ✅
- Rate limits: central LIMITS registry ✅
- Supabase clients: 3 factories (browser/server/admin), no ad-hoc createClient calls ✅
