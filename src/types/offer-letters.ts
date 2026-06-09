export interface OfferLetter {
  id:             string;
  application_id: string;
  uploaded_by:    string | null;
  file_path:      string;
  file_name:      string;
  file_size:      number | null;
  version:        number;
  notes:          string | null;
  expiry_date:    string | null;
  created_at:     string;
  updated_at:     string;
}

// Joined with uploader profile name for display
export interface OfferLetterWithUploader extends OfferLetter {
  uploader_name: string | null;
}
