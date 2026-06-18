export type TrustStatus = "draft" | "published" | "archived";

export const TRUST_STATUS_META: Record<TrustStatus, { label: string; colour: string }> = {
  draft:     { label: "Draft",     colour: "text-white/45 bg-white/[0.06] border-white/[0.10]"        },
  published: { label: "Published", colour: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  archived:  { label: "Archived",  colour: "text-amber-400 bg-amber-500/10 border-amber-400/25"       },
};

export const FACILITY_CATEGORIES = [
  { value: "lab",           label: "Lab / Workshop"   },
  { value: "library",       label: "Library"           },
  { value: "sports",        label: "Sports & Fitness"  },
  { value: "accommodation", label: "Accommodation"     },
  { value: "cafeteria",     label: "Cafeteria / Canteen" },
  { value: "it",            label: "IT / Computer Lab" },
  { value: "other",         label: "Other"             },
] as const;

export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number]["value"];

export interface Facility {
  id:                 string;
  college_id:         string;
  name:               string;
  description:        string | null;
  category:           FacilityCategory | null;
  cover_storage_path: string | null;
  cover_image_url:    string | null;
  status:             TrustStatus;
  sort_order:         number;
  uploaded_by:        string | null;
  created_at:         string;
  updated_at:         string;
  published_at:       string | null;
  archived_at:        string | null;
}

export interface Accreditation {
  id:                 string;
  college_id:         string;
  name:               string;
  issuing_body:       string;
  description:        string | null;
  logo_storage_path:  string | null;
  logo_url:           string | null;
  year_awarded:       number | null;
  valid_until:        number | null;
  status:             TrustStatus;
  sort_order:         number;
  uploaded_by:        string | null;
  created_at:         string;
  updated_at:         string;
  published_at:       string | null;
  archived_at:        string | null;
}

export interface Testimonial {
  id:                          string;
  college_id:                  string;
  student_name:                string;
  course_name:                 string | null;
  graduation_year:             number | null;
  testimonial_text:            string;
  rating:                      number | null;
  student_photo_storage_path:  string | null;
  student_photo_url:           string | null;
  status:                      TrustStatus;
  sort_order:                  number;
  uploaded_by:                 string | null;
  created_at:                  string;
  updated_at:                  string;
  published_at:                string | null;
  archived_at:                 string | null;
}

export interface SuccessStory {
  id:                 string;
  college_id:         string;
  person_name:        string;
  course_name:        string | null;
  graduation_year:    number | null;
  current_role:       string | null;
  current_company:    string | null;
  story_text:         string;
  photo_storage_path: string | null;
  photo_url:          string | null;
  status:             TrustStatus;
  sort_order:         number;
  uploaded_by:        string | null;
  created_at:         string;
  updated_at:         string;
  published_at:       string | null;
  archived_at:        string | null;
}
