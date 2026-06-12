// ─── Colleges ─────────────────────────────────────────────────────────────────

export interface College {
  id:          string;
  name:        string;
  slug:        string;
  logo_url:    string | null;
  country:     string;
  city:        string;
  description: string | null;
  website:     string | null;
  is_active:   boolean;
  created_at:  string;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export type CourseStatus    = "open" | "closed" | "draft";
export type CourseLevel     = "diploma" | "advanced_diploma" | "graduate_diploma" | "certificate";
export type CourseStudyMode = "full_time" | "part_time";

export const COURSE_CATEGORIES = [
  "Business",
  "Technology",
  "Engineering",
  "Hospitality",
  "Finance",
  "Design",
  "Communication",
  "Health",
  "Law",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export interface Course {
  id:              string;
  college_id:      string;
  title:           string;
  slug:            string;
  category:        string;
  description:     string | null;
  duration_months: number;
  tuition_fee:     number;
  application_fee: number;
  intake_date:     string | null;
  seats_total:     number;
  seats_filled:    number;
  study_mode:      CourseStudyMode;
  level:           CourseLevel;
  status:          CourseStatus;
  created_at:      string;

  // ── Optional: Media & Assets ───────────────────────────────────────────────
  thumbnail_url:   string | null;
  video_url:       string | null;
  brochure_url:    string | null;
  gallery_images:  string[] | null;  // array of image URLs

  // ── Optional: Career Outcomes ──────────────────────────────────────────────
  career_outcomes:                string[] | null;  // e.g. ["Business Manager", "Marketing Executive"]
  industries:                     string[] | null;  // e.g. ["Finance", "Consulting"]
  internship_available:           boolean  | null;
  internship_duration_months:     number   | null;
  estimated_internship_allowance: number   | null;
  pathway_description:            string   | null;
  job_outlook_description:        string   | null;
}

// Course joined with college info
export interface CourseWithCollege extends Course {
  colleges: Pick<College, "id" | "name" | "slug" | "logo_url" | "website">;
}

// ─── Applications ────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "docs_required"
  | "offer_ready"
  | "ipa_processing"
  | "approved"
  | "rejected";

export const APPLICATION_STATUSES: {
  value: ApplicationStatus;
  label: string;
  color: string;
  step:  number;
}[] = [
  { value: "submitted",      label: "Submitted",       color: "text-white/60     bg-white/[0.06]     border-white/[0.12]",         step: 1 },
  { value: "under_review",   label: "Under Review",    color: "text-pathBlue-400 bg-pathBlue-500/10  border-pathBlue-500/25",      step: 2 },
  { value: "docs_required",  label: "Docs Required",   color: "text-orange-400   bg-orange-500/10    border-orange-400/25",        step: 3 },
  { value: "offer_ready",    label: "Offer Ready",     color: "text-gold-400     bg-gold-400/10      border-gold-400/25",          step: 4 },
  { value: "ipa_processing", label: "IPA Processing",  color: "text-purple-400   bg-purple-500/10    border-purple-400/25",        step: 5 },
  { value: "approved",       label: "Approved",        color: "text-emerald-400  bg-emerald-500/10   border-emerald-400/25",       step: 6 },
  { value: "rejected",       label: "Rejected",        color: "text-red-400      bg-red-500/10       border-red-400/25",           step: -1 },
];

export interface Application {
  id:            string;
  student_id:    string;
  course_id:     string;
  status:        ApplicationStatus;
  current_stage: string;
  notes:         string | null;
  submitted_at:  string;
  updated_at:    string;
}

// Application joined with course + college
export interface ApplicationWithCourse extends Application {
  courses: CourseWithCollege;
}

// ─── Filters (course browser URL params) ─────────────────────────────────────

export interface CourseFiltersParams {
  search?:   string;
  category?: string;
  level?:    string;
  status?:   string;
  minFee?:   string;
  maxFee?:   string;
}
