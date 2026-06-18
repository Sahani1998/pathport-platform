export type VideoStatus = "draft" | "published" | "archived";

export interface InstitutionVideo {
  id:          string;
  college_id:  string;
  title:       string;
  description: string | null;
  video_url:   string;
  embed_url:   string | null;
  status:      VideoStatus;
  sort_order:  number;
  uploaded_by: string | null;
  created_at:  string;
  updated_at:  string;
  published_at: string | null;
  archived_at:  string | null;
}

export const VIDEO_STATUS_META: Record<VideoStatus, { label: string; colour: string }> = {
  draft:     { label: "Draft",     colour: "text-white/45 bg-white/[0.06] border-white/[0.10]"        },
  published: { label: "Published", colour: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  archived:  { label: "Archived",  colour: "text-amber-400 bg-amber-500/10 border-amber-400/25"       },
};
