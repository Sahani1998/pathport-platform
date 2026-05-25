import type { JourneyStep } from "@/types";

export const journeySteps: JourneyStep[] = [
  {
    step: 1,
    title: "Register Interest",
    description: "Fill in the PathPort interest form. Takes under 2 minutes.",
    icon: "📋",
  },
  {
    step: 2,
    title: "Free Counselling",
    description: "A PathPort advisor calls you within 24 hours for a free personalised consultation.",
    icon: "📞",
  },
  {
    step: 3,
    title: "College Selection",
    description: "We match you with the right Singapore private college based on your budget, goals, and background.",
    icon: "🏫",
  },
  {
    step: 4,
    title: "Offer Letter in 24hrs",
    description: "PathPort submits your application and secures a conditional offer letter — often within 24 hours.",
    icon: "📩",
    highlight: true,
  },
  {
    step: 5,
    title: "Student Pass Application",
    description: "We guide you through the ICA Student Pass process with near-100% first-application success.",
    icon: "🪪",
  },
  {
    step: 6,
    title: "Pre-Departure Briefing",
    description: "Full briefing on what to pack, what to expect, banking, accommodation, and arrival day.",
    icon: "🧳",
  },
  {
    step: 7,
    title: "Arrive in Singapore",
    description: "Your PathPort representative meets you at Changi Airport. Accommodation is ready.",
    icon: "🇸🇬",
  },
  {
    step: 8,
    title: "Study + Earn",
    description: "Start your diploma classes and enter the 6+6 pathway — studying and earning simultaneously.",
    icon: "🎓",
    highlight: true,
  },
];
