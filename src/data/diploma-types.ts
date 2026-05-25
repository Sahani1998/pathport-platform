import type { DiplomaType } from "@/types";

export const diplomaTypes: DiplomaType[] = [
  {
    id: "diploma",
    title: "Diploma",
    subtitle: "Foundation Level",
    description:
      "Entry-level qualification recognised across Singapore and internationally. Ideal for students with 10th or 12th standard backgrounds seeking structured industry knowledge.",
    duration: "12 – 18 months",
    eligibility: "10th / 12th Standard (CBSE, ICSE, State Board)",
    subjects: [
      "Business Administration",
      "Information Technology",
      "Hospitality Management",
      "Engineering Technology",
      "Mass Communication",
      "Early Childhood Education",
    ],
    icon: "🎓",
  },
  {
    id: "advanced-diploma",
    title: "Advanced Diploma",
    subtitle: "Intermediate Level",
    description:
      "Builds directly on Diploma qualifications, providing deeper subject mastery and advanced professional skills for career progression.",
    duration: "12 – 18 months",
    eligibility: "Diploma or equivalent qualification",
    subjects: [
      "Advanced Business Management",
      "Advanced IT & Networking",
      "Advanced Hospitality Operations",
      "Digital Marketing",
      "Supply Chain Management",
      "Financial Services",
    ],
    icon: "📘",
  },
  {
    id: "higher-diploma",
    title: "Higher Diploma",
    subtitle: "Near-Degree Level",
    description:
      "The highest level of diploma qualification — equivalent to the first year of a Bachelor's degree and a direct pathway into Year 2 at many partner universities.",
    duration: "18 – 24 months",
    eligibility: "Advanced Diploma or equivalent",
    subjects: [
      "Business with Finance",
      "Computing & Software Engineering",
      "International Hospitality Management",
      "Design & Visual Communication",
      "Healthcare Management",
      "Psychology & Counselling",
    ],
    icon: "🏅",
  },
  {
    id: "specialist-diploma",
    title: "Specialist Diploma",
    subtitle: "Professional Specialisation",
    description:
      "Designed for working professionals and graduates seeking to upskill in a specific domain. Part-time and full-time options available.",
    duration: "6 – 12 months",
    eligibility: "Diploma / Degree holders or working professionals",
    subjects: [
      "Digital Business Transformation",
      "Cybersecurity Operations",
      "Culinary Arts & F&B Management",
      "Real Estate & Property Management",
      "Human Resource Leadership",
      "Project Management",
    ],
    icon: "⭐",
  },
];
