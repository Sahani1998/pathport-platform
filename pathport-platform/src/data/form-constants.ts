// ─── All Indian States & Union Territories ────────────────────────────────────

export const INDIAN_STATES = [
  // States
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi (NCT)",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// ─── Countries (Primary + Secondary markets) ──────────────────────────────────

export const SUPPORTED_COUNTRIES = [
  { value: "India",       label: "🇮🇳 India",       primary: true  },
  { value: "Sri Lanka",   label: "🇱🇰 Sri Lanka",   primary: false },
  { value: "Nepal",       label: "🇳🇵 Nepal",       primary: false },
  { value: "Bangladesh",  label: "🇧🇩 Bangladesh",  primary: false },
  { value: "Bhutan",      label: "🇧🇹 Bhutan",      primary: false },
] as const;

// ─── Course Options ────────────────────────────────────────────────────────────

export const COURSE_OPTIONS = [
  "Business Administration",
  "Information Technology",
  "Hospitality & Tourism Management",
  "Engineering Technology",
  "Accounting & Finance",
  "Mass Communication & Media",
  "Design & Visual Communication",
  "Psychology & Counselling",
  "Healthcare Management",
  "Digital Marketing",
  "Supply Chain & Logistics",
  "Human Resource Management",
  "Early Childhood Education",
  "Cybersecurity",
  "Other / Not Sure Yet",
] as const;

// ─── Intake Options ───────────────────────────────────────────────────────────

export const INTAKE_OPTIONS = [
  "July 2026",
  "October 2026",
  "January 2027",
  "April 2027",
  "July 2027",
  "Flexible / Not decided yet",
] as const;

// ─── Budget Ranges ────────────────────────────────────────────────────────────

export const BUDGET_RANGES = [
  "Under S$5,000 / year",
  "S$5,000 – S$8,000 / year",
  "S$8,000 – S$12,000 / year",
  "S$12,000 – S$18,000 / year",
  "S$18,000+ / year",
  "Not sure — need guidance",
] as const;
