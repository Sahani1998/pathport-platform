# DATABASE_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12 · Source: 16 SQL migration files in `src/lib/supabase/`*

## 1. Complete Table Inventory (19 tables)

| Table | Defined in | RLS | Student | Institution | Admin | Indexes |
|---|---|---|---|---|---|---|
| profiles | schema.sql (+sprint8, courses_schema) | ✅ | own read/update | read applicants (s14) | all | ⚠️ **college_id NOT indexed** |
| colleges | courses_schema.sql | ✅ | public read | update own | all | slug |
| courses | courses_schema.sql + media migration | ✅ | public read | manage own | all | college_id, status, category, slug, internship |
| applications | courses_schema + timeline + s8 + s15 | ✅ | own read/insert | college read/update | all | student_id, course_id, status |
| student_education | sprint8 | ✅ | own CRUD | — | all | user_id |
| email_log | sprint8 | ✅ | own read | — | all | status, user, app, created |
| application_audit_log | sprint8 + s10 | ✅ | — | college read/insert | all | app, actor, action, created |
| student_documents | student_documents_schema + s10 | ✅ | own read/insert/delete | college read/update | all | student, app, status, type, uploaded |
| document_reviews | sprint10 | ✅ | own read | college read/insert | all | document, reviewer, created |
| offer_letters | sprint9 + s15 | ✅ | own read + decide (s15) | college all | all | app, uploaded_by, created |
| partner_applications | schema + s11 + s14 | ✅ | public insert; self read (s14) | — | all | status, type, created, email |
| partner_account_audit_log | sprint11 | ✅ | — | — | all | app, created |
| application_timeline_events | timeline schema | ✅ | visible-only read | college read/insert | all | app, stage, created |
| notifications | timeline schema + s10/s11 | ✅ | own read/mark-read | insert for college | all | user, app, read (partial), created |
| student_inquiries | student_inquiries.sql | ✅ | public insert | — | select/update | status, created, email, country |
| student_downloadable_documents | sprint13 | ✅ | own read | college all | all | student, app, created |
| document_requests | sprint15 | ✅ | own read | college all | all | app, student, status, created |
| application_notes | sprint15 | ✅ | **none (by design)** | college all | all | app, author, created |
| ipa_records | sprint15 | ✅ | own read | college all | all | app, status, created |

## 2. RLS Coverage: 100%
- Every table has RLS enabled with role-appropriate policies.
- Admin policies all route through `requesting_user_is_admin()` (SECURITY DEFINER) — avoids RLS recursion.
- Institution scoping uses `user_owns_college()` / `user_owns_course_college()` / `user_can_review_document()`.
- `application_notes` intentionally has NO student policy (internal notes).

## 3. SECURITY DEFINER Functions (verified safe)
| Function | Purpose |
|---|---|
| handle_new_user() | Auto-create profile on signup |
| requesting_user_is_admin() | Role check without recursion |
| user_owns_college(uuid) / user_owns_course_college(uuid) | Institution scoping |
| user_can_review_document(uuid) | Document review scoping |
| fulfil_document_requests() | Trigger: auto-fulfil requests on matching upload |

## 4. Triggers
- `on_auth_user_created` → profile creation
- `profiles_updated_at`, `applications_updated_at` → set_updated_at
- `trg_fulfil_document_requests` (AFTER INSERT on student_documents)
- `trg_doc_requests_touch`, `trg_app_notes_touch`, `trg_ipa_records_touch` → touch_updated_at

## 5. FINDINGS

### 🔴 Missing index
- **`profiles.college_id`** — FK added in courses_schema.sql with no index; used in every institution RLS policy lookup. Fix:
  ```sql
  CREATE INDEX IF NOT EXISTS profiles_college_id_idx ON public.profiles(college_id);
  ```

### 🟡 Dual status columns (technical debt, not broken)
- `applications.status` (7-value legacy check constraint) coexists with `applications.current_stage` (21-value modern). Kept in sync by app code + `sync_application_status_stage.sql`. Check constraint on `status` means any new stage MUST map back to one of the 7 legacy values via `STAGE_TO_STATUS`. Consolidation recommended long-term.

### 🟢 Not duplicates (verified)
- `student_documents` (student uploads) vs `student_downloadable_documents` (institution → student) — different directions, different buckets.
- `document_reviews` (feedback on uploads) vs `document_requests` (asks for uploads) — different purposes, linked by auto-fulfil trigger.
- `application_timeline_events` (student-facing story) vs `application_audit_log` (compliance log) — different visibility.

### 🟢 No orphans
- All tables referenced in TypeScript exist in migrations; all FKs use ON DELETE CASCADE/SET NULL appropriately; unique constraint `(student_id, course_id)` prevents duplicate applications.

## 6. Storage Buckets (4)
| Bucket | Limits | Access |
|---|---|---|
| student-documents | 10MB, PDF/JPG/PNG | student path-scoped, institution/admin read |
| offer-letters | default | institution/admin; students via signed URL |
| college-documents | default | institution/admin; students via signed URL |
| ipa-documents | 10MB, PDF only | institution/admin; students via signed URL (server API) |

## 7. Realtime Publication
- `applications`, `notifications` added in sprint15. ⚠️ Must verify publication actually applied in the live project.

## Verdict: Schema is production-grade. One missing index, one consolidation debt item, zero security gaps at the database layer.
