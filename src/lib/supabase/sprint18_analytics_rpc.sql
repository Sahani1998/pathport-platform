-- Sprint 18A — Analytics & Scalability Foundation
--
-- Replaces JavaScript aggregation in:
--   - src/app/dashboard/admin/analytics/page.tsx
--   - src/app/dashboard/institution/page.tsx
--   - src/app/dashboard/institution/reports/page.tsx   (new)
--
-- All three functions:
--   - SECURITY INVOKER (no service-role bypass; relies on internal admin/owner check)
--   - SET search_path = public (prevents schema-resolution hijacking)
--   - GRANT EXECUTE TO authenticated only
--   - Return jsonb (single round-trip; client never aggregates)
--
-- Stage resolution mirrors src/lib/application-stage-mapping.ts resolveStage().
-- APPROVED_STAGES mirrors src/lib/application-workflow.ts.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: resolve canonical stage from (current_stage, status)
-- Inlined into each function via CTE — no separate function needed because
-- PostgreSQL inlines this case expression efficiently.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════════════════════
-- A. get_admin_analytics_summary()
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Admin gate. The function is granted to authenticated, but only admins
  -- receive data — everyone else gets a hard error.
  IF NOT public.requesting_user_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH apps AS (
    SELECT
      a.id,
      a.student_id,
      a.course_id,
      a.submitted_at,
      COALESCE(
        a.current_stage,
        CASE a.status
          WHEN 'approved'       THEN 'approved'
          WHEN 'rejected'       THEN 'rejected'
          WHEN 'ipa_processing' THEN 'ipa_processing'
          WHEN 'offer_ready'    THEN 'offer_letter_ready'
          WHEN 'docs_required'  THEN 'documents_pending'
          WHEN 'under_review'   THEN 'documents_under_review'
          WHEN 'submitted'      THEN 'application_submitted'
          ELSE 'application_submitted'
        END
      ) AS stage
    FROM public.applications a
  ),
  by_stage AS (
    SELECT stage, COUNT(*)::int AS count
    FROM apps
    GROUP BY stage
  ),
  by_college AS (
    SELECT col.name AS college, COUNT(*)::int AS count
    FROM apps
    JOIN public.courses  c   ON c.id = apps.course_id
    JOIN public.colleges col ON col.id = c.college_id
    GROUP BY col.name
    ORDER BY count DESC
    LIMIT 10
  ),
  by_intake AS (
    SELECT
      to_char(date_trunc('month', c.intake_date), 'Mon YYYY') AS intake,
      COUNT(*)::int AS count
    FROM apps
    JOIN public.courses c ON c.id = apps.course_id
    WHERE c.intake_date IS NOT NULL
    GROUP BY date_trunc('month', c.intake_date)
    ORDER BY count DESC
    LIMIT 10
  ),
  by_country AS (
    SELECT COALESCE(p.country, 'Unknown') AS country, COUNT(*)::int AS count
    FROM apps
    LEFT JOIN public.profiles p ON p.id = apps.student_id
    GROUP BY COALESCE(p.country, 'Unknown')
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'total_students',     (SELECT COUNT(*)::int FROM public.profiles WHERE role = 'student'),
    'total_applications', (SELECT COUNT(*)::int FROM apps),
    'total_colleges',     (SELECT COUNT(*)::int FROM public.colleges),
    'total_courses',      (SELECT COUNT(*)::int FROM public.courses),
    'by_stage',           COALESCE((SELECT jsonb_object_agg(stage, count) FROM by_stage), '{}'::jsonb),
    'by_college',         COALESCE((SELECT jsonb_agg(jsonb_build_object('college', college, 'count', count)) FROM by_college), '[]'::jsonb),
    'by_intake',          COALESCE((SELECT jsonb_agg(jsonb_build_object('intake',  intake,  'count', count)) FROM by_intake),  '[]'::jsonb),
    'by_country',         COALESCE((SELECT jsonb_agg(jsonb_build_object('country', country, 'count', count)) FROM by_country), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_analytics_summary() TO authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- B. get_institution_dashboard_summary(p_college_id uuid)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_institution_dashboard_summary(p_college_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_college_id IS NULL THEN
    RAISE EXCEPTION 'p_college_id is required' USING ERRCODE = '22023';
  END IF;

  -- Caller must own the college or be admin.
  IF NOT (public.requesting_user_is_admin() OR public.user_owns_college(p_college_id)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH course_ids AS (
    SELECT id FROM public.courses WHERE college_id = p_college_id
  ),
  apps AS (
    SELECT
      a.id,
      a.submitted_at,
      COALESCE(
        a.current_stage,
        CASE a.status
          WHEN 'approved'       THEN 'approved'
          WHEN 'rejected'       THEN 'rejected'
          WHEN 'ipa_processing' THEN 'ipa_processing'
          WHEN 'offer_ready'    THEN 'offer_letter_ready'
          WHEN 'docs_required'  THEN 'documents_pending'
          WHEN 'under_review'   THEN 'documents_under_review'
          WHEN 'submitted'      THEN 'application_submitted'
          ELSE 'application_submitted'
        END
      ) AS stage
    FROM public.applications a
    WHERE a.course_id IN (SELECT id FROM course_ids)
  ),
  approval_times AS (
    -- First 'approved' timeline event per application → processing duration in days
    SELECT
      a.id AS application_id,
      EXTRACT(EPOCH FROM (MIN(t.created_at) - a.submitted_at)) / 86400.0 AS days
    FROM apps a
    JOIN public.application_timeline_events t
      ON t.application_id = a.id AND t.stage = 'approved'
    GROUP BY a.id, a.submitted_at
  ),
  apps_with_offer AS (
    SELECT DISTINCT application_id FROM public.offer_letters
    WHERE application_id IN (SELECT id FROM apps)
  ),
  doc_counts AS (
    SELECT status, COUNT(*)::int AS count
    FROM public.student_documents
    WHERE is_active = TRUE
      AND application_id IN (SELECT id FROM apps)
    GROUP BY status
  ),
  pipeline_counts AS (
    SELECT stage, COUNT(*)::int AS count FROM apps GROUP BY stage
  )
  SELECT jsonb_build_object(
    -- Spec-required fields
    'total_applications',     (SELECT COUNT(*)::int FROM apps),
    'pending_documents',      COALESCE((SELECT count FROM doc_counts WHERE status = 'pending'), 0),
    'approved_applications',  (
      -- Mirrors APPROVED_STAGES in src/lib/application-workflow.ts
      SELECT COUNT(*)::int FROM apps
      WHERE stage IN ('approved','arrival_preparation','arrived_singapore',
                      'enrolled','internship_eligible','completed')
    ),
    'rejected_applications',  (
      SELECT COUNT(*)::int FROM apps WHERE stage IN ('rejected','withdrawn')
    ),
    'offer_letters_issued',   (
      SELECT COUNT(*)::int FROM public.offer_letters
      WHERE application_id IN (SELECT id FROM apps)
    ),
    'ipa_processing',         (SELECT COUNT(*)::int FROM apps WHERE stage = 'ipa_processing'),
    'ipa_approved',           (SELECT COUNT(*)::int FROM apps WHERE stage = 'approved'),
    'conversion_rate',        CASE
                                WHEN (SELECT COUNT(*) FROM apps) > 0
                                  THEN ROUND(
                                    (SELECT COUNT(*)::numeric FROM apps
                                     WHERE stage IN ('approved','arrival_preparation','arrived_singapore',
                                                     'enrolled','internship_eligible','completed'))
                                    / (SELECT COUNT(*)::numeric FROM apps) * 100, 1)
                                ELSE 0
                              END,
    'avg_processing_days',    COALESCE(
      (SELECT ROUND(AVG(days)::numeric, 1) FROM approval_times),
      0
    ),

    -- Additional metrics used by src/app/dashboard/institution/page.tsx —
    -- bundled here so the page makes one RPC instead of N filter passes.
    'new_apps_7d',            (
      SELECT COUNT(*)::int FROM apps
      WHERE submitted_at >= NOW() - INTERVAL '7 days'
    ),
    'apps_this_month',        (
      SELECT COUNT(*)::int FROM apps
      WHERE submitted_at >= date_trunc('month', NOW())
    ),
    'offers_pending',         (
      SELECT COUNT(*)::int FROM apps
      WHERE stage IN ('documents_verified', 'offer_letter_processing')
        AND id NOT IN (SELECT application_id FROM apps_with_offer)
    ),
    'arrived_students',       (SELECT COUNT(*)::int FROM apps WHERE stage = 'arrived_singapore'),
    'docs_awaiting',          (
      SELECT COALESCE(SUM(count), 0)::int FROM doc_counts
      WHERE status IN ('pending','reupload_required')
    ),
    'verified_docs',          COALESCE((SELECT count FROM doc_counts WHERE status = 'verified'), 0),
    'rejected_docs',          COALESCE((SELECT count FROM doc_counts WHERE status = 'rejected'), 0),
    'pipeline_counts',        COALESCE((SELECT jsonb_object_agg(stage, count) FROM pipeline_counts), '{}'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_institution_dashboard_summary(UUID) TO authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- C. get_institution_reports(p_college_id, p_from, p_to)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_institution_reports(
  p_college_id UUID,
  p_from       DATE,
  p_to         DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_from DATE := COALESCE(p_from, (CURRENT_DATE - INTERVAL '12 months')::DATE);
  v_to   DATE := COALESCE(p_to,   CURRENT_DATE);
BEGIN
  IF p_college_id IS NULL THEN
    RAISE EXCEPTION 'p_college_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT (public.requesting_user_is_admin() OR public.user_owns_college(p_college_id)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH course_ids AS (
    SELECT id FROM public.courses WHERE college_id = p_college_id
  ),
  apps AS (
    SELECT
      a.id,
      a.submitted_at,
      to_char(date_trunc('month', a.submitted_at), 'YYYY-MM') AS month,
      COALESCE(
        a.current_stage,
        CASE a.status
          WHEN 'approved'       THEN 'approved'
          WHEN 'rejected'       THEN 'rejected'
          WHEN 'ipa_processing' THEN 'ipa_processing'
          WHEN 'offer_ready'    THEN 'offer_letter_ready'
          WHEN 'docs_required'  THEN 'documents_pending'
          WHEN 'under_review'   THEN 'documents_under_review'
          WHEN 'submitted'      THEN 'application_submitted'
          ELSE 'application_submitted'
        END
      ) AS stage
    FROM public.applications a
    WHERE a.course_id IN (SELECT id FROM course_ids)
      AND a.submitted_at >= v_from
      AND a.submitted_at <  (v_to + INTERVAL '1 day')
  ),
  apps_per_month AS (
    SELECT month, COUNT(*)::int AS count
    FROM apps
    GROUP BY month
    ORDER BY month
  ),
  approvals_per_month AS (
    SELECT month,
           COUNT(*) FILTER (WHERE stage IN ('approved','arrival_preparation','arrived_singapore',
                                            'enrolled','internship_eligible','completed'))::int AS count
    FROM apps
    GROUP BY month
    ORDER BY month
  ),
  conv_per_month AS (
    SELECT
      apm.month,
      CASE WHEN apm.count > 0
           THEN ROUND(appm.count::numeric / apm.count::numeric * 100, 1)
           ELSE 0
      END AS rate
    FROM apps_per_month apm
    JOIN approvals_per_month appm ON appm.month = apm.month
    ORDER BY apm.month
  ),
  approval_times AS (
    SELECT
      EXTRACT(EPOCH FROM (MIN(t.created_at) - a.submitted_at)) / 86400.0 AS days
    FROM apps a
    JOIN public.application_timeline_events t
      ON t.application_id = a.id AND t.stage = 'approved'
    GROUP BY a.id, a.submitted_at
  ),
  doc_turnaround AS (
    SELECT
      EXTRACT(EPOCH FROM (sd.reviewed_at - sd.uploaded_at)) / 86400.0 AS days
    FROM public.student_documents sd
    WHERE sd.is_active = TRUE
      AND sd.reviewed_at IS NOT NULL
      AND sd.application_id IN (SELECT id FROM apps)
  )
  SELECT jsonb_build_object(
    'applications_by_month',  COALESCE((
      SELECT jsonb_agg(jsonb_build_object('month', month, 'count', count))
      FROM apps_per_month
    ), '[]'::jsonb),
    'approvals_by_month',     COALESCE((
      SELECT jsonb_agg(jsonb_build_object('month', month, 'count', count))
      FROM approvals_per_month
    ), '[]'::jsonb),
    'conversion_by_month',    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('month', month, 'rate', rate))
      FROM conv_per_month
    ), '[]'::jsonb),
    'document_turnaround_days', COALESCE((SELECT ROUND(AVG(days)::numeric, 1) FROM doc_turnaround), 0),
    'average_processing_days',  COALESCE((SELECT ROUND(AVG(days)::numeric, 1) FROM approval_times), 0),
    'from_date',              v_from,
    'to_date',                v_to
  )
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_institution_reports(UUID, DATE, DATE) TO authenticated;
