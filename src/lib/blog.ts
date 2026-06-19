export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  author: string;
  featured?: boolean;
  tags: string[];
}

export const BLOG_CATEGORIES = [
  "Singapore",
  "Courses",
  "Student Pass",
  "Internships",
  "Accommodation",
  "Student Life",
  "Careers",
  "PathPort Updates",
] as const;

const POSTS: BlogPost[] = [
  {
    slug: "complete-guide-singapore-student-pass-india",
    title: "The Complete Guide to the Singapore Student Pass for Indian Students",
    excerpt: "Everything you need to know about the Singapore Student Pass — who submits it, how long it takes, what the IPA document is, and what to expect at Changi Airport immigration.",
    category: "Student Pass",
    publishedAt: "19 June 2026",
    readingTime: 8,
    author: "PathPort Editorial",
    featured: true,
    tags: ["student pass", "IPA", "singapore", "immigration", "indian students"],
  },
  {
    slug: "6-plus-6-internship-singapore-explained",
    title: "The 6+6 Internship Programme in Singapore — What It Actually Means",
    excerpt: "The 6+6 programme is one of Singapore's most distinctive education formats. Here is an honest breakdown of what the internship involves, how placement works, and what students earn.",
    category: "Internships",
    publishedAt: "15 June 2026",
    readingTime: 6,
    author: "PathPort Editorial",
    featured: false,
    tags: ["6+6", "internship", "singapore", "placement", "stipend"],
  },
  {
    slug: "opening-bank-account-singapore-student-pass",
    title: "How to Open a Bank Account in Singapore on a Student Pass",
    excerpt: "Step-by-step guide to opening a DBS, OCBC, or UOB bank account as a new Student Pass holder. What documents you need and common mistakes to avoid.",
    category: "Student Life",
    publishedAt: "10 June 2026",
    readingTime: 5,
    author: "PathPort Editorial",
    featured: false,
    tags: ["banking", "DBS", "POSB", "student pass", "singapore"],
  },
  {
    slug: "accommodation-little-india-singapore-guide",
    title: "Where to Live in Singapore — A Guide for Indian Students",
    excerpt: "From Little India HDB rooms to student hostels near Jurong — a practical overview of accommodation options, costs, and how to find a room before you arrive.",
    category: "Accommodation",
    publishedAt: "5 June 2026",
    readingTime: 7,
    author: "PathPort Editorial",
    featured: false,
    tags: ["accommodation", "little india", "housing", "HDB", "singapore"],
  },
  {
    slug: "singapore-diploma-vs-degree-indian-students",
    title: "Singapore Diploma vs Degree — What Makes Sense for Indian Students?",
    excerpt: "Comparing the cost, duration, career outcomes, and pathway options of a Singapore private college diploma versus a degree programme. A practical framework for decision-making.",
    category: "Courses",
    publishedAt: "1 June 2026",
    readingTime: 6,
    author: "PathPort Editorial",
    featured: false,
    tags: ["diploma", "degree", "EduTrust", "private college", "career"],
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find(p => p.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return POSTS.filter(p => p.category === category);
}
