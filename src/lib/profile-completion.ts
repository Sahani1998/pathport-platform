import type { Profile, StudentEducation } from "@/types/auth";

// Weighted profile completion calculator.
// Total = 100. Section weights chosen so all sections combined sum to 100.

interface CompletionInput {
  profile:   Pick<Profile,
    | "full_name" | "phone" | "country" | "date_of_birth" | "nationality"
    | "passport_number" | "passport_country" | "passport_expiry"
    | "emergency_contact_name" | "emergency_contact_phone" | "emergency_contact_relationship"
  >;
  education: Pick<StudentEducation, "id">[];
}

export interface CompletionResult {
  percent: number;
  sections: {
    personal:  { complete: boolean; weight: number };
    passport:  { complete: boolean; weight: number };
    emergency: { complete: boolean; weight: number };
    education: { complete: boolean; weight: number };
  };
}

export function computeProfileCompletion(input: CompletionInput): CompletionResult {
  const p = input.profile;

  const personal = Boolean(
    p.full_name && p.phone && p.country && p.date_of_birth && p.nationality,
  );
  const passport = Boolean(
    p.passport_number && p.passport_country && p.passport_expiry,
  );
  const emergency = Boolean(
    p.emergency_contact_name && p.emergency_contact_phone && p.emergency_contact_relationship,
  );
  const education = input.education.length > 0;

  const weights = { personal: 30, passport: 30, emergency: 20, education: 20 };
  let score = 0;
  if (personal)  score += weights.personal;
  if (passport)  score += weights.passport;
  if (emergency) score += weights.emergency;
  if (education) score += weights.education;

  return {
    percent: score,
    sections: {
      personal:  { complete: personal,  weight: weights.personal },
      passport:  { complete: passport,  weight: weights.passport },
      emergency: { complete: emergency, weight: weights.emergency },
      education: { complete: education, weight: weights.education },
    },
  };
}
