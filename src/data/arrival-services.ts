import type { ArrivalService } from "@/types";

export const arrivalServices: ArrivalService[] = [
  {
    id: "student-pass",
    title: "Student Pass / IPA Tracking",
    description: "Your enrolled college submits your Student Pass / IPA application to ICA Singapore from their official systems. PathPort tracks status, organises your supporting documents, and keeps you informed at every stage.",
    icon: "🪪",
    features: ["Document checklist", "Status tracking", "Stage-by-stage updates", "Pre-departure reminders"],
    featured: true,
  },
  {
    id: "airport",
    title: "Airport Pickup",
    description: "Your PathPort representative meets you at Changi Airport, hands you a SIM card, and transfers you directly to your accommodation.",
    icon: "✈️",
    features: ["Changi Airport pickup", "SIM card on arrival", "Accommodation transfer", "Welcome orientation"],
  },
  {
    id: "housing",
    title: "Student Housing",
    description: "Vetted, affordable student accommodations near your college — furnished, safe, and move-in ready from day one.",
    icon: "🏠",
    features: ["Pre-arrival booking", "Fully furnished", "Flexible lease", "Indian roommate matching"],
  },
  {
    id: "banking",
    title: "Bank Account Setup",
    description: "Hassle-free DBS/POSB student bank account activation within your first week, including digital banking setup.",
    icon: "🏦",
    features: ["Pre-arranged appointment", "Document support", "Digital banking", "Indian remittance guidance"],
  },
  {
    id: "health",
    title: "Medical Insurance",
    description: "Comprehensive student health insurance meeting all ICA and college requirements, starting from day one of your Student Pass.",
    icon: "🩺",
    features: ["ICA compliant", "Panel clinic access", "Emergency coverage", "Mental health support"],
  },
  {
    id: "orientation",
    title: "India Student Orientation",
    description: "A dedicated 2-day orientation for Indian students — covering MRT, daily life, college registration, and connecting with the Indian community in Singapore.",
    icon: "🗺️",
    features: ["MRT & transport guide", "College registration", "Indian community connect", "Essential apps setup"],
  },
];
