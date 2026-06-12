# SUPABASE_VERIFICATION_REPORT.md — PathPort Platform
*Report date: 2026-06-12 · Verified from repository code*

## What can be verified from code vs what requires dashboard access

This report documents everything verifiable from the repository. Items requiring live Supabase dashboard access are marked with a manual action flag.

---

## 1. SQL migration files — status

| File | Purpose | Codebase handles missing table? | Action needed |
|---|---|---|---|
| schema.sql | profiles, partner_applications, trigger | N/A — core schema | ✅ Must be run |
| courses_schema.sql | colleges, courses, applications | N/A — core schema | ✅ Must be run |
| student_documents_schema.sql | student_documents, bucket | N/A — core schema | ✅ Must be run |
| application_timeline_schema.sql | timeline_events, notifications | N/A — core schema | ✅ Must be run |
| student_inquiries.sql | student_inquiries | N/A — core schema | ✅ Must be run |
| courses_media_migration.sql | media/career columns | N/A — core schema | ✅ Must be run |
| sprint8_migrations.sql | education, email_log, audit_log, profile fields | N/A — core schema | ✅ Must be run |
| sprint9_offer_letters.sql | offer_letters, offer-letters bucket | 42P01 graceful | ✅ Must be run |
| sprint10_document_verification.sql | document_reviews + policies | 42P01 graceful | ✅ Must be run |
| sprint11_partner_approval.sql | partner approval columns | 42P01 graceful | ✅ Must be run |
| admin_rls_fix.sql / admin_access_verification.sql | admin policy helpers | N/A | ✅ Must be run |
| sync_application_status_stage.sql | status↔stage backfill | N/A | ✅ Must be run |
| **sprint13_college_documents.sql** | student_downloadable_documents + college-documents bucket | ✅ 42P01 handled | ⚠️ **VERIFY if run** |
| **sprint14_security_hardening.sql** | partner self-read + institution-read-applicants policies | ✅ silent no-op if unrun | ⚠️ **VERIFY if run** |
| **sprint15_application_processing.sql** | document_requests, application_notes, ipa_records, offer decision columns, fulfil trigger, ipa-documents bucket, realtime | ✅ 42P01 handled | ⚠️ **VERIFY if run** |
| **sprint16_hardening.sql** | profiles.college_id index | N/A — additive | ⚠️ **RUN THIS** (new) |

**All files are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) — safe to re-run.**

---

## 2. Storage buckets — verify in Supabase Dashboard → Storage

| Bucket | Created by | Access | Size limit | Status |
|---|---|---|---|---|
| student-documents | student_documents_schema.sql | Private | — | ✅ Expected to exist |
| offer-letters | sprint9 | Private | 10MB PDF | ✅ Expected to exist |
| college-documents | sprint13 | Private | — | ⚠️ Verify (depends on sprint13) |
| ipa-documents | sprint15 | Private | 10MB PDF | ⚠️ Verify (depends on sprint15; may need manual creation if INSERT into storage.buckets was blocked by RLS) |

---

## 3. Realtime publication — verify in Database → Publications

sprint15 adds `applications` + `notifications` to `supabase_realtime` publication.

**Quick check SQL (run in SQL Editor):**
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Expected rows: at minimum `applications` and `notifications`.

If missing, run sprint15 SQL or manually add:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## 4. Auth settings — verify in Supabase Dashboard → Authentication → URL Configuration

| Setting | Required value | Notes |
|---|---|---|
| Site URL | `https://pathport-platform.vercel.app` | Or your custom domain |
| Redirect URLs (allowlist) | `https://pathport-platform.vercel.app/reset-password` | Required for password reset |
| | `https://pathport-platform-ad80097-8180s-projects.vercel.app/reset-password` | Team domain — add this too |
| | `https://pathport-platform.vercel.app/auth/callback` | For PKCE flows |
| | `https://pathport-platform.vercel.app/activate-account` | Partner activation |
| Email confirmations | ON for students | Default Supabase setting |

**Root cause of password reset bugs:** Supabase silently replaces `redirectTo` with Site URL when the redirect URL is not on this allowlist. Both Vercel domain variants must be added.

---

## 5. Functions & triggers — verify in SQL Editor

```sql
-- Check all custom functions exist
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY 1;
```

Expected: `requesting_user_is_admin`, `user_owns_college`, `user_owns_course_college`, `user_can_review_document`, `fulfil_document_requests`, `handle_new_user`

```sql
-- Check RLS policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY 1
ORDER BY 1;
```

Expected: 19 tables each with at least 1 policy.

```sql
-- Check storage buckets
SELECT id, public FROM storage.buckets ORDER BY id;
```

---

## 6. Sprint 16 SQL to run

**Run this in Supabase SQL Editor:**

```sql
-- From src/lib/supabase/sprint16_hardening.sql
CREATE INDEX IF NOT EXISTS profiles_college_id_idx
  ON public.profiles (college_id);
```

This index is missing from all previous migrations and was identified in the scalability audit as causing full-table scans on the profiles table when joining through college_id.
