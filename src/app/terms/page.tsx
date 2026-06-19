import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | PathPort",
  description: "PathPort Terms of Service — governing the use of our Singapore diploma application platform.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "19 June 2026";
const CONTACT_EMAIL  = "pathpportsg@gmail.com";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-3xl mx-auto">

          <div className="mb-10">
            <p className="text-gold-400/70 font-body text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Terms of Service</h1>
            <p className="text-white/40 font-body text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <div className="space-y-8 text-white/65 font-body text-sm leading-relaxed">

            <Section title="1. About PathPort">
              <p>PathPort (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a Singapore-based education platform that connects students from India and other countries to private colleges in Singapore offering diploma, advanced diploma, higher diploma, and specialist diploma programmes. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the PathPort website, application portal, and related services (collectively, the &ldquo;Services&rdquo;).</p>
              <p>By registering an account or using the Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.</p>
            </Section>

            <Section title="2. Eligibility">
              <p>You must be at least 17 years of age to use the Services. By creating an account, you represent that all information you provide is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials.</p>
            </Section>

            <Section title="3. Services Provided">
              <p>PathPort provides:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>An application management portal for diploma programmes at Singapore private colleges</li>
                <li>Document submission and review workflows</li>
                <li>Offer letter facilitation (typically within 24 hours of a complete application)</li>
                <li>Status tracking for In-Principle Approval (IPA) / Student Pass applications</li>
                <li>Invoice generation and payment tracking for college tuition fees</li>
                <li>Arrival services information and coordination</li>
                <li>Optional SG Arrival Card preparation guidance on request</li>
              </ul>
              <p className="mt-3"><strong className="text-white/80">Important — IPA / Student Pass submission:</strong> Student Pass and IPA applications are submitted to the Immigration &amp; Checkpoints Authority (ICA) of Singapore <em>by the enrolled college / institution</em> through their official ICA systems. PathPort does not submit applications to ICA on behalf of students. PathPort&apos;s role is limited to application tracking, document organisation, status updates, and student support. SG Arrival Card submission remains the student&apos;s responsibility unless PathPort has separately agreed in writing to assist on request.</p>
              <p className="mt-3">PathPort acts as an intermediary between students and partner colleges. We do not guarantee admission, visa approval, or employment. All admissions decisions rest with the colleges, and all visa decisions rest with the Immigration &amp; Checkpoints Authority (ICA) of Singapore.</p>
            </Section>

            <Section title="4. Student Obligations">
              <p>You agree to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Provide accurate and truthful information in all applications and documents</li>
                <li>Upload only genuine, unaltered documents (passport, transcripts, financial proofs, photographs)</li>
                <li>Pay invoices issued by colleges through the PathPort platform within stated deadlines</li>
                <li>Comply with Singapore laws and immigration regulations</li>
                <li>Notify PathPort promptly of any changes to your personal details, passport, or circumstances</li>
              </ul>
              <p className="mt-3">Submitting false, forged, or misleading documents is a serious offence under Singapore law and will result in immediate termination of your application and account, and may be reported to the relevant authorities.</p>
            </Section>

            <Section title="5. Fees and Payments">
              <p>Tuition fees and other charges are set by the colleges and are invoiced through the PathPort platform. PathPort is not responsible for fee changes by colleges. All payments are subject to the college&apos;s refund and cancellation policy.</p>
              <p className="mt-3">PathPort service fees, if applicable, will be disclosed clearly before any transaction. Payments made are non-refundable except as required by applicable Singapore law or as expressly agreed in writing.</p>
            </Section>

            <Section title="6. Intellectual Property">
              <p>All content on the PathPort platform, including text, graphics, logos, and software, is owned by or licensed to PathPort and is protected by Singapore copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works without our written consent.</p>
            </Section>

            <Section title="7. Data Privacy">
              <p>Your use of the Services is subject to our <Link href="/privacy" className="text-pathBlue-400 hover:text-pathBlue-300 underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal data in compliance with Singapore&apos;s Personal Data Protection Act 2012 (PDPA).</p>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>To the fullest extent permitted by Singapore law, PathPort shall not be liable for:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Rejection of visa or student pass applications by ICA</li>
                <li>Rejection of admission applications by colleges</li>
                <li>Delays caused by third parties, government agencies, or force majeure events</li>
                <li>Indirect, incidental, or consequential losses</li>
              </ul>
              <p className="mt-3">Our total liability to you in connection with the Services shall not exceed the amount you paid to PathPort (not college fees) in the three months preceding the claim.</p>
            </Section>

            <Section title="9. Termination">
              <p>PathPort may suspend or terminate your account at any time if you breach these Terms, provide fraudulent information, or if required by law. Upon termination, your access to the Services ceases immediately, but we may retain your data as required by law or for legitimate business purposes as described in our Privacy Policy.</p>
            </Section>

            <Section title="10. Governing Law and Dispute Resolution">
              <p>These Terms are governed by the laws of the Republic of Singapore. Any dispute arising from or in connection with these Terms shall first be referred to mediation at the Singapore Mediation Centre. If mediation fails, disputes shall be resolved by the courts of Singapore, and you irrevocably submit to their exclusive jurisdiction.</p>
            </Section>

            <Section title="11. Changes to These Terms">
              <p>We may update these Terms from time to time. If we make material changes, we will notify you by email or by a prominent notice in the platform. Continued use of the Services after the effective date of revised Terms constitutes your acceptance.</p>
            </Section>

            <Section title="12. Contact Us">
              <p>If you have questions about these Terms, please contact us at: <a href={`mailto:${CONTACT_EMAIL}`} className="text-pathBlue-400 hover:text-pathBlue-300">{CONTACT_EMAIL}</a></p>
            </Section>

          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-white/30 font-body text-xs">© {new Date().getFullYear()} PathPort · All rights reserved</p>
            <Link href="/privacy" className="text-pathBlue-400 hover:text-pathBlue-300 font-body text-sm transition-colors">
              Privacy Policy →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
