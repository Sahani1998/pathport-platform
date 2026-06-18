export type PersonStatus = "draft" | "published" | "archived";

export interface LeadershipMember {
  id:                 string;
  college_id:         string;
  name:               string;
  role:               string;
  bio:                string | null;
  photo_storage_path: string | null;
  photo_url:          string | null;
  status:             PersonStatus;
  sort_order:         number;
  uploaded_by:        string | null;
  created_at:         string;
  updated_at:         string;
  published_at:       string | null;
  archived_at:        string | null;
}

export interface FacultyMember {
  id:                 string;
  college_id:         string;
  name:               string;
  title:              string;
  department:         string | null;
  qualifications:     string | null;
  bio:                string | null;
  photo_storage_path: string | null;
  photo_url:          string | null;
  status:             PersonStatus;
  sort_order:         number;
  uploaded_by:        string | null;
  created_at:         string;
  updated_at:         string;
  published_at:       string | null;
  archived_at:        string | null;
}

export const PERSON_STATUS_META: Record<PersonStatus, { label: string; colour: string }> = {
  draft:     { label: "Draft",     colour: "text-white/45 bg-white/[0.06] border-white/[0.10]"        },
  published: { label: "Published", colour: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  archived:  { label: "Archived",  colour: "text-amber-400 bg-amber-500/10 border-amber-400/25"       },
};
