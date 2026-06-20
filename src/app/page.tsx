export const dynamic = "force-dynamic";

import Navbar                 from "@/components/layout/Navbar";
import Footer                 from "@/components/layout/Footer";
import HeroImmersive          from "@/components/sections/HeroImmersive";
import InstitutionLogoWall    from "@/components/sections/InstitutionLogoWall";
import WhySingaporeStory      from "@/components/sections/WhySingaporeStory";
import JourneyVisualTimeline  from "@/components/sections/JourneyVisualTimeline";
import PhotoBand              from "@/components/ui/PhotoBand";
import DestinationPathway     from "@/components/sections/DestinationPathway";
import StudyEarnStory         from "@/components/sections/StudyEarnStory";
import ParentTrustStory       from "@/components/sections/ParentTrustStory";
import FinalCTABand           from "@/components/sections/FinalCTABand";

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
      <main id="main-content" className="bg-white">
        {/* 1 · Full-bleed photography hero with overlaid callback form */}
        <HeroImmersive />

        {/* 2 · Trust logos strip — verified institutions marquee */}
        <InstitutionLogoWall />

        {/* 3 · Why Singapore — image-left editorial split (cream) */}
        <WhySingaporeStory />

        {/* 4 · Journey visual timeline — 8 photographed steps */}
        <JourneyVisualTimeline />

        {/* 5 · Full-bleed photo band — graduation rest beat */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=2400&q=75"
          alt="Diploma graduate holding a certificate at a Singapore graduation ceremony"
          caption="Graduation day, Singapore"
          height="lg"
        />

        {/* 6 · Destination pathway — country/destination strip
            NOTE: Hardcoded for PR-G. Sprint 31 will swap data source to DB. */}
        <DestinationPathway />

        {/* 7 · Study + Earn — image-right editorial split (white) */}
        <StudyEarnStory />

        {/* 8 · Parent trust — cream editorial section */}
        <ParentTrustStory />

        {/* 9 · Full-bleed photo + interest form conversion CTA */}
        <FinalCTABand />
      </main>
      <Footer />
    </>
  );
}
