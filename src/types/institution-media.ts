export type MediaStatus   = "draft" | "published" | "archived";
export type MediaCategory = "campus" | "facilities" | "events" | "student_life" | "other";

export const MEDIA_CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "campus",       label: "Campus"        },
  { value: "facilities",   label: "Facilities"    },
  { value: "events",       label: "Events"        },
  { value: "student_life", label: "Student Life"  },
  { value: "other",        label: "Other"         },
];

export interface InstitutionMedia {
  id:              string;
  college_id:      string;
  media_type:      string;
  category:        MediaCategory | null;
  title:           string | null;
  caption:         string | null;
  alt_text:        string | null;
  storage_path:    string;
  public_url:      string;
  file_size_bytes: number | null;
  status:          MediaStatus;
  sort_order:      number;
  uploaded_by:     string | null;
  created_at:      string;
  updated_at:      string;
  published_at:    string | null;
  archived_at:     string | null;
}

export const MEDIA_STATUS_META: Record<MediaStatus, { label: string; colour: string }> = {
  draft:     { label: "Draft",     colour: "text-white/45  bg-white/[0.06]  border-white/[0.10]"          },
  published: { label: "Published", colour: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25"     },
  archived:  { label: "Archived",  colour: "text-amber-400  bg-amber-500/10  border-amber-400/25"         },
};

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function fmtFileSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
