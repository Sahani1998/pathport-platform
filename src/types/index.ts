// ─── Domain Models ─────────────────────────────────────────────────────────────

export interface DiplomaType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  feeRange: string;
  eligibility: string;
  subjects: string[];
  icon: string;
}

export interface PrivateCollege {
  id: string;
  name: string;
  shortName?: string;
  specialisms: string[];
  intakes: string[];
  tag?: string;
}

export interface WhySingaporeReason {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface JourneyStep {
  step: number;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

export interface ArrivalService {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  featured?: boolean;
}

export interface OfferLetterFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// ─── Form Data ─────────────────────────────────────────────────────────────────

export interface StudentInterestFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  country: string;
  indianState: string;
  city: string;
  courseInterest: string;
  intendedIntake: string;
  budgetRange: string;
}

// ─── UI ────────────────────────────────────────────────────────────────────────

export type ButtonVariant = "solid-gold" | "solid-blue" | "outline-gold" | "outline-blue" | "ghost";
export type ButtonSize    = "sm" | "md" | "lg";
export type BadgeVariant  = "gold" | "blue" | "navy" | "success" | "muted";

// ─── Student Inquiries ────────────────────────────────────────────────────────

export type InquiryStatus = "new" | "contacted" | "converted" | "not_interested";

export interface StudentInquiry {
  id:              string;
  full_name:       string;
  email:           string;
  whatsapp_number: string | null;
  country:         string | null;
  indian_state:    string | null;
  city:            string | null;
  course_interest: string | null;
  intended_intake: string | null;
  budget_range:    string | null;
  status:          InquiryStatus;
  notes:           string | null;
  created_at:      string;
}
