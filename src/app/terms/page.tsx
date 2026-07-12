import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms of service — PondoFlow" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <p>
        These Terms govern your use of PondoFlow. By creating an account you
        agree to them on behalf of your company.
      </p>
      <h2>The service</h2>
      <p>
        PondoFlow provides workforce scheduling, time tracking, payroll
        computation, payslips, and related reports. Statutory computations
        follow published Philippine government tables; you remain responsible
        for reviewing payroll runs before finalizing and for your company&apos;s
        filings and remittances to SSS, PhilHealth, Pag-IBIG, and the BIR.
      </p>
      <h2>Accounts &amp; responsibilities</h2>
      <ul>
        <li>Keep your credentials confidential; you are responsible for activity under your account.</li>
        <li>Enter accurate employee and compensation data.</li>
        <li>Use employee self-service access only for legitimate employment purposes.</li>
      </ul>
      <h2>Subscription &amp; billing</h2>
      <p>
        Plans are billed monthly at ₱800 per company plus ₱100 per active
        employee, with optional add-ons. Trials convert only when you
        subscribe. You may cancel anytime; access continues until the end of
        the paid period.
      </p>
      <h2>Data</h2>
      <p>
        Your company owns its data. See our Privacy Policy and Privacy Notice
        for how personal information is handled under RA 10173.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        The service is provided &quot;as is&quot;. To the maximum extent
        permitted by law, PondoFlow is not liable for indirect or consequential
        damages, and our aggregate liability is limited to fees paid in the
        three months preceding a claim.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these Terms; material changes will be announced in-app at
        least 15 days in advance.
      </p>
    </LegalPage>
  );
}
