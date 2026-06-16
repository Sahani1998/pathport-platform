# APPLICATION_WORKFLOW_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12*

## 1. End-to-end Journey Map

| Step | Stage value | Built? | Notes |
|---|---|---|---|
| Inquiry | (pre-application) | ✅ | Public form → `student_inquiries`; admin pipeline (new/contacted/converted) on admin dashboard |
| Application | application_submitted | ✅ | `/api/applications/apply`, duplicate-prevention unique constraint, email |
| Document upload | documents_pending/uploaded | ✅ | student-documents bucket, type/size validation |
| Document review | documents_under_review/verified | ✅ | `/api/documents/[id]/review` with history table, required comments on reject/reupload |
| Document request | documents_pending | ✅ | sprint15: institution requests → student card → auto-fulfil trigger |
| Offer letter issue | offer_letter_ready | ✅ | versioned PDF upload, expiry date, stage advance |
| Offer accept/decline | offer_letter_accepted | ✅ | sprint15: student decision + comment, internal email |
| Fee payment | fee_payment_pending | ⚠️ **STAGE ONLY** | Stage + email template exist; **no payment recording module** (no amount, no receipt, no mark-as-paid UI) — stage is advanced manually |
| IPA processing | ipa_processing | ✅ | sprint15: PDF upload, status workflow, signed downloads |
| IPA approved | approved | ✅ | approval auto-advances via `advanceApplicationStage()` |
| Arrival preparation | arrival_preparation | ⚠️ **STAGE ONLY** | Stage exists; `/dashboard/student/arrival` is a static hardcoded checklist (no data model) |
| Enrollment | enrolled | ⚠️ **STAGE ONLY** | Stage + email exist; no enrollment record/confirmation UI |
| Internship eligible | internship_eligible | ⚠️ **STAGE ONLY** | Stage exists; `/dashboard/student/internships` is "Coming Soon" |
| Terminal | completed / rejected / withdrawn | ✅ | Withdrawal flow complete with reason + audit |

## 2. Dead ends / missing steps
- **No dead ends in the built pipeline** — every built stage has a next action and an actor who can perform it.
- The last third of the journey (fee payment → arrival → enrollment → internship) is **stage-advance-only**: an admin/institution can move the stage and the student gets notified/emailed, but there is no underlying record (payment receipt, arrival checklist state, enrollment confirmation, internship placement).

## 3. Consistency findings

### 🟡 Dual status systems (see DUPLICATION_AUDIT for detail)
- `applications.status` (7 legacy values) + `applications.current_stage` (21 modern values), bridged by `STAGE_TO_STATUS` / `STATUS_TO_STAGE` / `resolveStage()`.
- `STATUS_TO_STAGE` is lossy (`under_review` could be any of 3 stages).

### 🟡 Asymmetric side effects between the two stage-update routes
- `/api/applications/[id]/stage` → timeline + notification + audit + **email** ✅
- `/api/applications/[id]/status` (legacy, used by `StatusUpdateSelect`) → timeline + notification + audit but **NO email** ❌ — students moved via the legacy dropdown get no email.

### 🟡 Helper bypasses
- `/api/offer-letters` POST and `/api/documents/[id]/review` re-implement timeline/notification/audit inline instead of calling `advanceApplicationStage()`/helpers. Behaviour is currently equivalent but will drift.

### 🟢 Single progress definition
- `STAGE_PROGRESS`, `STAGE_META`, `STAGE_NOTIFICATION`, `STAGE_EMAIL` all live in/are re-exported by `src/lib/application-workflow.ts` — one import surface.
- `ALLOWED_TRANSITIONS` exists but `canTransition()` is **never enforced** in any API route — any stage can currently be set from any stage by an authorized user. Decide: enforce or remove.

## Verdict: Pipeline is complete and consistent through IPA approval. The post-approval lifecycle (fee payment records, arrival, enrollment, internship) is stage-scaffolded but has no functional modules. Legacy /status route should be retired.
