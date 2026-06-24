export interface CourseGalleryImage {
  id:              string;
  course_id:       string;
  college_id:      string;
  storage_path:    string;
  public_url:      string;
  alt_text:        string | null;
  sort_order:      number;
  file_size_bytes: number | null;
  uploaded_by:     string | null;
  created_at:      string;
}

export type CourseMediaAction =
  | "upload_thumbnail"
  | "delete_thumbnail"
  | "upload_brochure"
  | "delete_brochure"
  | "upload_gallery_image"
  | "delete_gallery_image";

export interface CourseMediaAudit {
  id:              string;
  course_id:       string;
  college_id:      string;
  user_id:         string;
  action:          CourseMediaAction;
  storage_path:    string | null;
  file_size_bytes: number | null;
  created_at:      string;
}
