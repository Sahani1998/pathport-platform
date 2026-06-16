// Return shapes for sprint18_analytics_rpc.sql RPCs.
// Keep in sync with the function bodies in
// src/lib/supabase/sprint18_analytics_rpc.sql.

export interface AdminAnalyticsSummary {
  total_students:     number;
  total_applications: number;
  total_colleges:     number;
  total_courses:      number;
  by_stage:           Record<string, number>;
  by_college:         { college: string; count: number }[];
  by_intake:          { intake: string;  count: number }[];
  by_country:         { country: string; count: number }[];
}

export interface InstitutionDashboardSummary {
  total_applications:    number;
  pending_documents:     number;
  approved_applications: number;
  rejected_applications: number;
  offer_letters_issued:  number;
  ipa_processing:        number;
  ipa_approved:          number;
  conversion_rate:       number;   // 0–100
  avg_processing_days:   number;

  // Extras bundled by get_institution_dashboard_summary for the dashboard UI.
  new_apps_7d:           number;
  apps_this_month:       number;
  offers_pending:        number;
  arrived_students:      number;
  docs_awaiting:         number;
  verified_docs:         number;
  rejected_docs:         number;
  pipeline_counts:       Record<string, number>;
}

export interface InstitutionReports {
  applications_by_month:    { month: string; count: number }[];
  approvals_by_month:       { month: string; count: number }[];
  conversion_by_month:      { month: string; rate:  number }[];
  document_turnaround_days: number;
  average_processing_days:  number;
  from_date:                string;
  to_date:                  string;
}
