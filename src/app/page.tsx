export const dynamic = "force-dynamic";

import Navbar                from "@/components/layout/Navbar";
import Footer                from "@/components/layout/Footer";
import HeroSection           from "@/components/sections/HeroSection";
import PlatformStats         from "@/components/sections/PlatformStats";
import JourneySummary        from "@/components/sections/JourneySummary";
import InstitutionLogoWall   from "@/components/sections/InstitutionLogoWall";
import DiplomaCategories     from "@/components/sections/DiplomaCategories";
import StudyEarnGraduate     from "@/components/sections/StudyEarnGraduate";
import WhyTrustPathPort      from "@/components/sections/WhyTrustPathPort";
import SingaporeTeaser       from "@/components/sections/SingaporeTeaser";
import SuccessTeaser         from "@/components/sections/SuccessTeaser";
import ResourceTeaser        from "@/components/sections/ResourceTeaser";
import CTASection            from "@/components/sections/CTASection";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PathPort",
  url: "https://pathport.sg",
  description: "India's dedicated platform for Singapore private college diploma, advanced diploma, higher diploma, and specialist diploma programmes.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+65-8377-6492",
    contactType: "customer service",
    email: "pathportsg@gmail.com",
    areaServed: ["IN", "SG"],
    availableLanguage: ["English", "Hindi"],
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "SG",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <main id="main-content">
        {/* 1 · Hero with interest form (dark) */}
        <HeroSection />
        {/* 2 · Trust proof row — live DB counters */}
        <PlatformStats />
        {/* 3 · Student journey summary — 4 steps, full timeline on /students */}
        <JourneySummary />
        {/* 4 · Verified institutions logo wall */}
        <InstitutionLogoWall />
        {/* 5 · Popular pathways / courses */}
        <DiplomaCategories />
        {/* 6 · Study + Internship summary */}
        <StudyEarnGraduate />
        {/* 7 · Parent trust summary (cream) */}
        <WhyTrustPathPort />
        {/* 8 · Singapore life teaser — full guides on /resources */}
        <SingaporeTeaser />
        {/* 9 · Success stories teaser — real DB stories only */}
        <SuccessTeaser />
        {/* 10 · Resource / blog teaser */}
        <ResourceTeaser />
        {/* 11 · Final CTA (dark) */}
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
