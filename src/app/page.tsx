import Navbar              from "@/components/layout/Navbar";
import Footer              from "@/components/layout/Footer";
import HeroSection         from "@/components/sections/HeroSection";
import StudentInterestForm from "@/components/sections/StudentInterestForm";
import WhySingapore        from "@/components/sections/WhySingapore";
import DiplomaCategories   from "@/components/sections/DiplomaCategories";
import InternshipPathway   from "@/components/sections/InternshipPathway";
import PrivateColleges     from "@/components/sections/PrivateColleges";
import OfferLetterSupport  from "@/components/sections/OfferLetterSupport";
import ArrivalServices     from "@/components/sections/ArrivalServices";
import StudentJourney      from "@/components/sections/StudentJourney";
import CTASection          from "@/components/sections/CTASection";

/**
 * PathPort Homepage
 *
 * Business: India's dedicated Singapore private college diploma platform
 * Primary market: India → Singapore
 * Secondary (future): Sri Lanka, Nepal, Bangladesh, Bhutan → Singapore
 *
 * Sections:
 *  1.  Hero (two-column: text left, quick form + dashboard right)
 *  2.  Student Interest Form (full 9-field form)
 *  3.  Why Singapore for Indian Students
 *  4.  Diploma Categories (Diploma / Advanced / Higher / Specialist)
 *  5.  6+6 Study + Paid Internship Pathway
 *  6.  Singapore Private Colleges
 *  7.  24-Hour Offer Letter Support
 *  8.  Arrival Services
 *  9.  Student Journey (India → Singapore timeline)
 *  10. CTA
 *  11. Footer
 */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StudentInterestForm />
        <WhySingapore />
        <DiplomaCategories />
        <InternshipPathway />
        <PrivateColleges />
        <OfferLetterSupport />
        <ArrivalServices />
        <StudentJourney />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
