# PathPort Platform

> Singapore's premier student pathway SaaS — connecting international students to diploma programmes, paid internships, and global university degrees.

![PathPort Hero](public/og-image.png)

## ✨ Overview

PathPort is a production-ready SaaS platform built on the **6+6 Pathway Model**:
- **6 months** — Singapore polytechnic diploma foundations
- **6 months** — Paid industry internship (S$800–S$1,500/month)
- **Month 13+** — Guaranteed credit transfer to 40+ partner universities worldwide

---

## 🚀 Tech Stack

| Layer        | Technology |
|--------------|------------|
| Framework    | Next.js 14 (App Router) |
| Language     | TypeScript (strict mode) |
| Styling      | Tailwind CSS |
| Animations   | Framer Motion |
| Icons        | Lucide React |
| Fonts        | Cormorant Garamond + Outfit (Google Fonts) |

---

## 📁 Project Structure

```
pathport-platform/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles, CSS variables, scrollbar
│   │   ├── layout.tsx           # Root layout — fonts, metadata, body
│   │   └── page.tsx             # Homepage — section composition
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Sticky navbar with mobile menu
│   │   │   └── Footer.tsx       # Full footer with links + contact
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StudentInterestForm.tsx
│   │   │   ├── DiplomaCategories.tsx
│   │   │   ├── InternshipPathway.tsx
│   │   │   ├── PartnerColleges.tsx
│   │   │   ├── ArrivalServices.tsx
│   │   │   ├── SuccessStories.tsx
│   │   │   └── CTASection.tsx
│   │   └── ui/
│   │       ├── GlassCard.tsx    # Glassmorphism card primitive
│   │       ├── GoldButton.tsx   # Gold CTA button (solid/outline/ghost)
│   │       ├── SectionHeader.tsx
│   │       └── Badge.tsx
│   ├── data/
│   │   ├── diploma-categories.ts
│   │   ├── partner-colleges.ts
│   │   ├── success-stories.ts
│   │   └── arrival-services.ts
│   ├── lib/
│   │   └── utils.ts             # cn(), slugify()
│   └── types/
│       └── index.ts             # All TypeScript interfaces
└── public/                      # Static assets
```

---

## 🎨 Design System

| Token         | Value |
|---------------|-------|
| Background    | `#060B18` (deep space navy) |
| Primary Navy  | `#0D1530` |
| Gold Accent   | `#C9A84C` |
| Gold Light    | `#E5C862` |
| Display Font  | Cormorant Garamond (serif) |
| Body Font     | Outfit (sans-serif) |
| Card Style    | Glassmorphism (`backdrop-blur` + `bg-white/7`) |

---

## 🏁 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/Sahani1998/pathport-platform.git
cd pathport-platform

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Available Scripts

```bash
npm run dev          # Development server (hot reload)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking (no emit)
```

---

## 📐 Homepage Sections

1. **Hero** — Headline, subtitle, CTAs, stats bar
2. **Student Interest Form** — Lead capture with validation + success state
3. **Diploma Categories** — 8 Singapore polytechnic streams
4. **6+6 Internship Pathway** — Three-phase timeline visualisation
5. **Partner Colleges** — 12+ universities with country filter
6. **Arrival Services** — 6 white-glove services
7. **Success Stories** — 4 student testimonials
8. **CTA** — Conversion section with trust signals
9. **Footer** — Navigation, contact, social, legal

---

## 🛣️ Roadmap

- [ ] Student Dashboard
- [ ] Application Portal
- [ ] Document Upload System
- [ ] Partner University Portal
- [ ] Advisor CRM
- [ ] Internship Job Board
- [ ] Scholarship Matching Engine

---

## 📄 License

Private & Proprietary — PathPort Pte. Ltd. © 2025
