export const dynamic = "force-dynamic";

import Navbar              from "@/components/layout/Navbar";
import Footer              from "@/components/layout/Footer";
import HeroSection         from "@/components/sections/HeroSection";
import StudentInterestForm from "@/components/sections/StudentInterestForm";
import WhySingapore        from "@/components/sections/WhySingapore";
import SingaporeGallery    from "@/components/sections/SingaporeGallery";
import DiplomaCategories   from "@/components/sections/DiplomaCategories";
import InternshipPathway   from "@/components/sections/InternshipPathway";
import PrivateColleges        from "@/components/sections/PrivateColleges";
import InstitutionLogoWall    from "@/components/sections/InstitutionLogoWall";
import OfferLetterSupport     from "@/components/sections/OfferLetterSupport";
import ArrivalServices     from "@/components/sections/ArrivalServices";
import StudentJourney      from "@/components/sections/StudentJourney";
import CTASection          from "@/components/sections/CTASection";

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
        <HeroSection />
        <StudentInterestForm />
        <WhySingapore />
        <SingaporeGallery />
        <DiplomaCategories />
        <InternshipPathway />
        <PrivateColleges />
        <InstitutionLogoWall />
        <OfferLetterSupport />
        <ArrivalServices />
        <StudentJourney />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
