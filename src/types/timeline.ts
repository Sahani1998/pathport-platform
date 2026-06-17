// ─── Application Stages ───────────────────────────────────────────────────────

export type ApplicationStage =
  | "application_submitted"
  | "documents_pending"
  | "documents_uploaded"
  | "documents_under_review"
  | "documents_verified"
  | "offer_letter_processing"
  | "offer_letter_ready"
  | "offer_letter_accepted"
  | "fee_payment_pending"             // Application Fee gate (kept name; relabelled)
  | "ipa_processing"
  | "approved"
  | "tuition_fee_payment_pending"     // Tuition Fee gate (new in Sprint 19)
  | "arrival_preparation"
  | "arrived_singapore"
  | "enrolled"
  | "internship_eligible"
  | "completed"
  | "rejected"
  | "withdrawn";

export interface StageMeta {
  value:       ApplicationStage;
  label:       string;
  description: string;
  step:        number;   // -1 = off-path (rejected/withdrawn)
  color:       string;   // Tailwind class string
  emoji:       string;
}

export const STAGE_META: StageMeta[] = [
  { value: "application_submitted",   label: "Application Submitted",   step: 1,  emoji: "📋", color: "text-white/70      bg-white/[0.07]     border-white/[0.12]",         description: "Your application has been received."                         },
  { value: "documents_pending",       label: "Documents Pending",       step: 2,  emoji: "📎", color: "text-orange-400   bg-orange-500/10    border-orange-400/25",         description: "Please upload your required documents."                       },
  { value: "documents_uploaded",      label: "Documents Uploaded",      step: 3,  emoji: "📤", color: "text-pathBlue-400 bg-pathBlue-500/10  border-pathBlue-500/25",       description: "Documents received. Awaiting review."                         },
  { value: "documents_under_review",  label: "Documents Under Review",  step: 4,  emoji: "🔍", color: "text-pathBlue-400 bg-pathBlue-500/10  border-pathBlue-500/25",       description: "Our team is reviewing your documents."                        },
  { value: "documents_verified",      label: "Documents Verified",      step: 5,  emoji: "✅", color: "text-emerald-400  bg-emerald-500/10   border-emerald-400/25",        description: "All documents have been verified."                            },
  { value: "offer_letter_processing", label: "Offer Letter Processing", step: 6,  emoji: "📝", color: "text-gold-400     bg-gold-400/10      border-gold-400/25",           description: "Your offer letter is being prepared by the college."          },
  { value: "offer_letter_ready",      label: "Offer Letter Ready",      step: 7,  emoji: "📩", color: "text-gold-400     bg-gold-400/15      border-gold-400/35",           description: "Your offer letter is ready! Please review it."                },
  { value: "offer_letter_accepted",   label: "Offer Letter Accepted",   step: 8,  emoji: "🎊", color: "text-emerald-400  bg-emerald-500/10   border-emerald-400/25",        description: "You've accepted your offer. Next: fee payment."               },
  { value: "fee_payment_pending",        label: "Application Fee Payment", step: 9,  emoji: "💳", color: "text-orange-400   bg-orange-500/10    border-orange-400/25",         description: "Please complete the application fee payment."                  },
  { value: "ipa_processing",             label: "IPA Processing",          step: 10, emoji: "🪪", color: "text-purple-400   bg-purple-500/10    border-purple-400/25",         description: "Your In-Principle Approval is being processed by ICA."        },
  { value: "approved",                   label: "IPA Approved",            step: 11, emoji: "🎉", color: "text-emerald-400  bg-emerald-500/10   border-emerald-400/25",        description: "Congratulations! Your IPA has been approved."                 },
  { value: "tuition_fee_payment_pending",label: "Tuition Fee Payment",     step: 12, emoji: "💰", color: "text-orange-400   bg-orange-500/10    border-orange-400/25",         description: "Please complete the tuition fee payment to proceed."           },
  { value: "arrival_preparation",        label: "Arrival Preparation",     step: 13, emoji: "✈️", color: "text-pathBlue-400 bg-pathBlue-500/10  border-pathBlue-500/25",       description: "Preparing for your arrival in Singapore."                     },
  { value: "arrived_singapore",          label: "Arrived Singapore",       step: 14, emoji: "🇸🇬", color: "text-gold-400     bg-gold-400/10      border-gold-400/25",           description: "Welcome to Singapore! Your journey starts here."              },
  { value: "enrolled",                   label: "Enrolled",                step: 15, emoji: "🎓", color: "text-emerald-400  bg-emerald-500/10   border-emerald-400/25",        description: "You are officially enrolled in your programme."               },
  { value: "internship_eligible",        label: "Internship Eligible",     step: 16, emoji: "💼", color: "text-pathBlue-400 bg-pathBlue-500/10  border-pathBlue-500/25",       description: "You are now eligible for internship placement."               },
  { value: "completed",                  label: "Completed",               step: 17, emoji: "🏁", color: "text-gold-400     bg-gold-400/10      border-gold-400/25",           description: "Your programme journey is complete. Congratulations!"          },
  { value: "rejected",                label: "Not Progressed",          step: -1, emoji: "❌", color: "text-red-400      bg-red-500/10       border-red-400/25",            description: "This application was not taken forward."                      },
  { value: "withdrawn",               label: "Withdrawn",               step: -1, emoji: "↩️", color: "text-white/40     bg-white/[0.05]     border-white/[0.09]",          description: "This application was withdrawn."                              },
];

// Ordered happy-path stages (no rejected/withdrawn)
export const TIMELINE_STAGES = STAGE_META.filter(s => s.step > 0).sort((a, b) => a.step - b.step);

export function getStageMeta(stage: ApplicationStage): StageMeta {
  return STAGE_META.find(s => s.value === stage) ?? STAGE_META[0];
}

// ─── Timeline events ──────────────────────────────────────────────────────────

export interface ApplicationTimelineEvent {
  id:                 string;
  application_id:     string;
  stage:              ApplicationStage;
  title:              string;
  description:        string | null;
  created_by:         string | null;
  created_by_role:    string | null;
  visible_to_student: boolean;
  created_at:         string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "application_update"
  | "document_update"
  | "payment_update"
  | "offer_letter"
  | "system";

export interface Notification {
  id:             string;
  user_id:        string;
  application_id: string | null;
  title:          string;
  message:        string;
  type:           NotificationType;
  read_at:        string | null;
  created_at:     string;
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, { label: string; emoji: string; color: string }> = {
  application_update: { label: "Application",  emoji: "📋", color: "text-pathBlue-400" },
  document_update:    { label: "Documents",     emoji: "📎", color: "text-orange-400"   },
  payment_update:     { label: "Payment",       emoji: "💳", color: "text-gold-400"     },
  offer_letter:       { label: "Offer Letter",  emoji: "📩", color: "text-gold-400"     },
  system:             { label: "System",        emoji: "🔔", color: "text-white/50"     },
};

// ─── Stage → auto-notification copy ──────────────────────────────────────────
// Used by the API route to generate the right notification when stage changes.
export const STAGE_NOTIFICATION: Partial<Record<ApplicationStage, { title: string; message: string; type: NotificationType }>> = {
  documents_pending:       { title: "Action Required: Upload Documents",      message: "Please upload your required admission documents to proceed.",                         type: "document_update"    },
  documents_under_review:  { title: "Documents Under Review",                 message: "Your documents have been received and are being reviewed by our team.",               type: "document_update"    },
  documents_verified:      { title: "Documents Verified ✅",                  message: "All your documents have been verified. Your offer letter is being prepared.",         type: "document_update"    },
  offer_letter_processing: { title: "Offer Letter Being Prepared",            message: "Your offer letter is being prepared by the college. We'll notify you when it's ready.", type: "offer_letter"     },
  offer_letter_ready:      { title: "Your Offer Letter is Ready! 📩",         message: "Your offer letter is ready. Please review it and confirm acceptance.",               type: "offer_letter"       },
  offer_letter_accepted:   { title: "Offer Accepted 🎊",                      message: "You've accepted your offer letter. Next step: complete your fee payment to proceed.", type: "offer_letter"       },
  fee_payment_pending:           { title: "Action Required: Application Fee Payment", message: "Please complete your application fee payment to proceed with IPA processing.",            type: "payment_update"     },
  ipa_processing:                { title: "IPA Processing Started 🪪",                 message: "Your In-Principle Approval is being processed by ICA Singapore. This takes 2–4 weeks.",     type: "application_update" },
  approved:                      { title: "IPA Approved! 🎉",                          message: "Congratulations! Your In-Principle Approval has been issued. Welcome aboard!",             type: "application_update" },
  tuition_fee_payment_pending:   { title: "Action Required: Tuition Fee Payment",     message: "Your IPA has been approved. Please complete your tuition fee payment to proceed with arrival preparation.", type: "payment_update" },
  arrival_preparation:           { title: "Arrival Preparation Started ✈️",            message: "PathPort is preparing your arrival support. Check your email for logistics details.",     type: "application_update" },
  arrived_singapore:       { title: "Welcome to Singapore! 🇸🇬",              message: "You've arrived! Your PathPort advisor will contact you for orientation and next steps.", type: "application_update" },
  enrolled:                { title: "Enrollment Completed 🎓",                message: "You are now officially enrolled in your programme. Your student journey begins!",     type: "application_update" },
  internship_eligible:     { title: "Internship Eligible 💼",                 message: "You are now eligible for internship placement. Explore opportunities in your dashboard.", type: "application_update" },
  completed:               { title: "Journey Completed 🏁",                   message: "Congratulations on completing your programme. We wish you every success ahead!",      type: "application_update" },
  rejected:                { title: "Application Update",                     message: "We regret to inform you that your application was not taken forward at this stage. Please contact your advisor.", type: "application_update" },
};
