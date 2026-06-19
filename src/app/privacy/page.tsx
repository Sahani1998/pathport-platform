import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | PathPort",
  description: "PathPort Privacy Policy — how we collect, use, and protect your personal data under Singapore's PDPA.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "19 June 2026";
const CONTACT_EMAIL  = "pathpportsg@gmail.com";
const DPO_EMAIL      = "pathpportsg@gmail.com";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-3xl mx-auto">

          <div className="mb-10">
            <p className="text-gold-400/70 font-body text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Privacy Policy</h1>
            <p className="text-white/40 font-body text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <div className="space-y-8 text-white/65 font-body text-sm leading-relaxed">

            <Section title="1. Introduction">
              <p>PathPort (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and protect personal data in connection with our Services, and your rights under Singapore&apos;s Personal Data Protection Act 2012 (&ldquo;PDPA&rdquo;).</p>
              <p>By using PathPort&apos;s Services, you consent to the collection and use of your personal data as described in this Policy.</p>
            </Section>

            <Section title="2. Personal Data We Collect">
              <p>We collect the following categories of personal data:</p>

              <div className="mt-3 space-y-4">
                <DataCategory title="Identity &amp; Contact Information">
                  Full name, email address, mobile number, date of birth, nationality, country of residence, and profile photograph.
                </DataCategory>

                <DataCategory title="Passport &amp; Immigration Documents">
                  Passport number, passport expiry date, passport scan/copy, previous visa history, and immigration status documents. This information is required to facilitate In-Principle Approval (IPA) / Student Pass applications with Singapore&apos;s ICA.
                </DataCategory>

                <DataCategory title="Educational Records">
                  Academic transcripts, certificates, school leaving certificates, language proficiency test results, and prior qualifications.
                </DataCategory>

                <DataCategory title="Financial Information">
                  Bank statements, sponsorship letters, income proofs, and invoice/payment records for college tuition fees. We do not store credit card or debit card numbers — payments are processed by third-party providers.
                </DataCategory>

                <DataCategory title="Application Data">
                  Course selections, application status, correspondence with colleges, offer letters, and IPA documents.
                </DataCategory>

                <DataCategory title="Technical Data">
                  IP address, browser type, device identifiers, and usage logs collected automatically when you use the platform.
                </DataCategory>
              </div>
            </Section>

            <Section title="3. How We Use Your Personal Data">
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Processing and managing your college applications</li>
                <li>Facilitating IPA / Student Pass applications with ICA Singapore</li>
                <li>Communicating with you about your application status, invoices, and documents</li>
                <li>Generating and managing invoices for tuition fee payments</li>
                <li>Complying with Singapore laws and regulatory requirements</li>
                <li>Improving our platform and services</li>
                <li>Preventing fraud, detecting abuse, and ensuring platform security</li>
                <li>Sending transactional notifications (application updates, payment confirmations)</li>
              </ul>
              <p className="mt-3">We do not sell your personal data to third parties for marketing purposes.</p>
            </Section>

            <Section title="4. Disclosure of Personal Data">
              <p>We may share your personal data with:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong className="text-white/80">Partner Colleges:</strong> Your application documents, educational records, and contact details are shared with the Singapore private college you apply to. This is necessary to process your application.</li>
                <li><strong className="text-white/80">Immigration &amp; Checkpoints Authority (ICA) Singapore:</strong> Your passport details and immigration documents are shared as required to process your Student Pass application.</li>
                <li><strong className="text-white/80">Service Providers:</strong> Cloud hosting (Supabase), email services, and payment processors who assist us in operating the platform. All service providers are bound by data processing agreements.</li>
                <li><strong className="text-white/80">Legal Authorities:</strong> When required by law, court order, or to protect the rights, property, or safety of PathPort, its users, or the public.</li>
              </ul>
            </Section>

            <Section title="5. Data Retention">
              <p>We retain your personal data for the following periods:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong className="text-white/80">Active account data:</strong> Retained for as long as your account is active</li>
                <li><strong className="text-white/80">Application records, invoices, and immigration documents:</strong> Retained for 7 years after your application closes, to comply with Singapore statutory requirements and for audit purposes</li>
                <li><strong className="text-white/80">Technical/usage logs:</strong> Retained for 90 days</li>
              </ul>
              <p className="mt-3">After the applicable retention period, data is securely deleted or anonymised.</p>
            </Section>

            <Section title="6. Data Security">
              <p>We implement appropriate technical and organisational measures to protect your personal data, including:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Encryption in transit (TLS) and at rest for all stored data</li>
                <li>Access controls — only authorised staff and the college you applied to can access your data</li>
                <li>Row-level security policies on our database ensuring each user sees only their own records</li>
                <li>Private, access-controlled storage for sensitive documents (passport scans, IPA letters, financial proofs)</li>
              </ul>
              <p className="mt-3">No method of transmission over the internet is 100% secure. While we strive to protect your personal data, we cannot guarantee absolute security.</p>
            </Section>

            <Section title="7. Cookies and Tracking">
              <p>We use session cookies essential for platform functionality (authentication). We do not use advertising cookies or third-party tracking cookies. You can disable cookies in your browser settings, but this may affect platform functionality.</p>
            </Section>

            <Section title="8. Your Rights Under PDPA">
              <p>Under the Singapore PDPA, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong className="text-white/80">Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong className="text-white/80">Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
                <li><strong className="text-white/80">Withdrawal of consent:</strong> Withdraw consent at any time (subject to legal and contractual restrictions). Note: withdrawal may prevent us from processing your application</li>
                <li><strong className="text-white/80">Data portability:</strong> Receive your data in a commonly used machine-readable format</li>
              </ul>
              <p className="mt-3">To exercise your rights, contact our Data Protection Officer at: <a href={`mailto:${DPO_EMAIL}`} className="text-pathBlue-400 hover:text-pathBlue-300">{DPO_EMAIL}</a>. We will respond within 30 days.</p>
            </Section>

            <Section title="9. International Data Transfers">
              <p>Your data is stored on servers operated by Supabase, which may be located outside Singapore. Where data is transferred internationally, we ensure appropriate safeguards are in place to protect your data consistent with PDPA requirements.</p>
            </Section>

            <Section title="10. Children's Privacy">
              <p>Our Services are not directed at children under 17. If you are under 17, you must have parental or guardian consent to use PathPort. We do not knowingly collect personal data from children under 17 without verified parental consent.</p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. Material changes will be communicated by email or by a prominent notice on the platform. The updated Policy will be effective from the date indicated at the top of this page.</p>
            </Section>

            <Section title="12. Contact Us">
              <p>For privacy enquiries or to exercise your PDPA rights, contact us at:</p>
              <div className="mt-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <p className="text-white/70">PathPort Data Protection Officer</p>
                <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-pathBlue-400 hover:text-pathBlue-300">{CONTACT_EMAIL}</a></p>
              </div>
            </Section>

          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-white/30 font-body text-xs">© {new Date().getFullYear()} PathPort · All rights reserved</p>
            <Link href="/terms" className="text-pathBlue-400 hover:text-pathBlue-300 font-body text-sm transition-colors">
              Terms of Service →
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

function DataCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pl-4 border-l-2 border-white/[0.08]">
      <p className="font-semibold text-white/75 mb-0.5">{title}</p>
      <p>{children}</p>
    </div>
  );
}
