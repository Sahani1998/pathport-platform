# SUPABASE_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12 · Note: audited from repository; live project state needs dashboard verification*

## 1. SQL files in repo (execution order)
| # | File | Contains | Run in live project? |
|---|---|---|---|
| 1 | schema.sql | profiles, partner_applications, signup trigger | ✅ (platform works) |
| 2 | courses_schema.sql | colleges, courses, applications + seeds | ✅ |
| 3 | student_documents_schema.sql | student_documents + bucket | ✅ |
| 4 | application_timeline_schema.sql | timeline_events, notifications | ✅ |
| 5 | student_inquiries.sql | student_inquiries | ✅ |
| 6 | courses_media_migration.sql | media/career columns | ✅ |
| 7 | sprint8_migrations.sql | education, email_log, audit_log, profile fields | ✅ |
| 8 | sprint9_offer_letters.sql | offer_letters + bucket | ✅ |
| 9 | sprint10_document_verification.sql | document_reviews + policies | ✅ |
| 10 | sprint11_partner_approval.sql | partner approval columns + audit | ✅ |
| 11 | admin_rls_fix.sql / admin_access_verification.sql | admin policy helpers | ✅ |
| 12 | sync_application_status_stage.sql | status↔stage backfill | ✅ |
| 13 | **sprint13_college_documents.sql** | student_downloadable_documents + college-documents bucket | ⚠️ **VERIFY** |
| 14 | **sprint14_security_hardening.sql** | partner self-read, institution-read-applicants policies | ⚠️ **VERIFY** |
| 15 | **sprint15_application_processing.sql** | document_requests, application_notes, ipa_records, offer decision columns, auto-fulfil trigger, ipa-documents bucket, realtime | ⚠️ **VERIFY** |

App code handles missing sprint13/15 tables gracefully (42P01), so the platform "works" even if they're unrun — but the features silently no-op. **Run any unrun file top-to-bottom in the SQL Editor; all are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).**

## 2. Storage buckets checklist
| Bucket | Created by | Verify |
|---|---|---|
| student-documents | student_documents_schema.sql | exists, private |
| offer-letters | sprint9 | exists, private |
| college-documents | sprint13 | exists, private |
| **ipa-documents** | sprint15 | **exists, private, 10MB PDF** — SQL inserts into storage.buckets, which may be blocked; create manually if missing |

## 3. Realtime
- sprint15 adds `applications` + `notifications` to `supabase_realtime` publication. Verify under Database → Publications. Without it, `RealtimeRefresher` silently does nothing (no errors, just no live refresh).

## 4. Auth settings (dashboard — manual)
| Setting | Required value |
|---|---|
| Site URL | Canonical production domain (currently the team domain — change to `https://pathport-platform.vercel.app` or final custom domain) |
| Redirect URLs | `https://pathport-platform.vercel.app/reset-password`, `https://pathport-platform-ad80097-8180s-projects.vercel.app/reset-password`, `https://pathport-platform.vercel.app/auth/callback`, `https://pathport-platform.vercel.app/activate-account`, plus team-domain equivalents (or wildcard `https://*-ad80097-8180s-projects.vercel.app/**`) |
| Email confirmations | ON for students |

## 5. Supabase email templates
- Default Supabase templates used for confirm-signup / magic-link / recovery. Recovery template must use `{{ .RedirectTo }}`-based link (default does). Transactional product emails go through Resend — separate system, OK.

## 6. Functions / triggers to verify live
`requesting_user_is_admin`, `user_owns_college`, `user_owns_course_college`, `user_can_review_document`, `fulfil_document_requests`, `handle_new_user`, touch triggers.
Quick check SQL:
```sql
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY 1;
SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname='public' GROUP BY 1 ORDER BY 1;
SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime';
SELECT id, public FROM storage.buckets;
```

## 7. Recommended additions
- `CREATE INDEX profiles_college_id_idx ON public.profiles(college_id);` (missing FK index)
- No cron jobs / edge functions exist or are required yet; future: email retry queue, deadline reminders for document_requests (pg_cron candidates).
