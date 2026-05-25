import type { PrivateCollege } from "@/types";

export const privateColleges: PrivateCollege[] = [
  {
    id: "psb",
    name: "PSB Academy",
    shortName: "PSB",
    specialisms: ["Engineering", "Business", "IT", "Design"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
    tag: "Top Rated",
  },
  {
    id: "kaplan",
    name: "Kaplan Singapore",
    shortName: "Kaplan",
    specialisms: ["Business", "Finance", "Psychology", "Law"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
    tag: "Popular",
  },
  {
    id: "mdis",
    name: "MDIS",
    shortName: "MDIS",
    specialisms: ["Business", "Engineering", "Media", "Nursing"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
  },
  {
    id: "easb",
    name: "East Asia Institute of Management",
    shortName: "EASB",
    specialisms: ["Business", "Hospitality", "Tourism"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
  },
  {
    id: "tmc",
    name: "TMC Academy",
    shortName: "TMC",
    specialisms: ["Business", "IT", "Psychology", "Media"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
  },
  {
    id: "dimensions",
    name: "Dimensions International College",
    shortName: "Dimensions",
    specialisms: ["Hospitality", "Business", "IT", "Design"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
  },
  {
    id: "informatics",
    name: "Informatics Academy",
    shortName: "Informatics",
    specialisms: ["IT", "Business", "Multimedia"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
  },
  {
    id: "saa",
    name: "SAA Global Education",
    shortName: "SAA Global",
    specialisms: ["Accounting", "Business", "Finance"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
    tag: "ACCA Pathway",
  },
  {
    id: "raffles",
    name: "Raffles College of Higher Education",
    shortName: "Raffles",
    specialisms: ["Design", "Fashion", "Business", "Media"],
    intakes: ["Jan", "Apr", "Jul", "Oct"],
    tag: "Creative Arts",
  },
];

export const COLLEGE_SPECIALISMS = [
  "All", "Business", "IT", "Design", "Hospitality", "Engineering", "Finance",
] as const;
export type CollegeSpecialism = (typeof COLLEGE_SPECIALISMS)[number];
