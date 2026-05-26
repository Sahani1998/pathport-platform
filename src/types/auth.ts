// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES = [
  "student",
  "admin",
  "institution",
  "recruitment_partner",
  "employer",
] as const;

export type UserRole = (typeof ROLES)[number];

// ─── Profile (mirrors public.profiles table) ──────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Auth state ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// ─── Role metadata (UI display) ───────────────────────────────────────────────

export interface RoleMeta {
  value: UserRole;
  label: string;
  description: string;
  icon: string;
  color: string;         // Tailwind border/bg colour class
  dashboardPath: string;
}

export const ROLE_META: RoleMeta[] = [
  {
    value: "student",
    label: "Student",
    description: "Apply to Singapore diploma programmes and track your journey.",
    icon: "🎓",
    color: "pathBlue",
    dashboardPath: "/dashboard/student",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage the PathPort platform, students, and operations.",
    icon: "⚙️",
    color: "gold",
    dashboardPath: "/dashboard/admin",
  },
  {
    value: "institution",
    label: "Institution",
    description: "Manage your college's listings, applications, and students.",
    icon: "🏫",
    color: "pathBlue",
    dashboardPath: "/dashboard/institution",
  },
  {
    value: "recruitment_partner",
    label: "Recruitment Partner",
    description: "Source and place qualified candidates for Singapore roles.",
    icon: "🤝",
    color: "gold",
    dashboardPath: "/dashboard/partner",
  },
  {
    value: "employer",
    label: "Employer",
    description: "Find and hire talented diploma interns and graduates.",
    icon: "💼",
    color: "pathBlue",
    dashboardPath: "/dashboard/employer",
  },
];

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
  country?: string;
}
