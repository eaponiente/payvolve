import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy policy — PondoFlow" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        This Privacy Policy describes how PondoFlow (&quot;we&quot;, &quot;us&quot;)
        collects, uses, and protects personal information when you use our
        payroll and workforce management platform. We process personal data in
        accordance with the Data Privacy Act of 2012 (Republic Act No. 10173)
        and its implementing rules.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account data: name, email address, and password (stored hashed).</li>
        <li>
          Employee records your company enters: names, positions, pay rates,
          government identification numbers (TIN, SSS, PhilHealth, Pag-IBIG),
          time entries, schedules, and payslips.
        </li>
        <li>Billing data: subscription status and invoice history.</li>
        <li>Contact form submissions: name, email, company, and message.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To operate payroll computations, schedules, and payslips.</li>
        <li>To bill your subscription and provide support.</li>
        <li>To comply with legal obligations under Philippine law.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell personal data. Data is shared only with service providers
        strictly necessary to operate the platform (e.g., hosting and payment
        processing) under appropriate safeguards.
      </p>
      <h2>Security &amp; retention</h2>
      <p>
        Data is encrypted in transit, passwords are hashed, and access is
        role-based within your company. We retain records for as long as your
        account is active or as required by BIR and DOLE record-keeping rules.
      </p>
      <h2>Your rights</h2>
      <p>
        Under the Data Privacy Act you may access, correct, or request deletion
        of your personal data, and lodge complaints with the National Privacy
        Commission. Contact our Data Protection Officer at privacy@pondoflow.ph.
      </p>
    </LegalPage>
  );
}
