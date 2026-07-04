import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy notice — PondoFlow" };

export default function PrivacyNoticePage() {
  return (
    <LegalPage title="Privacy Notice" updated="July 2026">
      <p>
        This notice is addressed to <strong>employees</strong> whose employers
        use PondoFlow. Your employer is the personal information controller of
        your employment records; PondoFlow processes them on your employer&apos;s
        behalf as a personal information processor under the Data Privacy Act
        of 2012 (RA 10173).
      </p>
      <h2>What your employer stores in PondoFlow</h2>
      <ul>
        <li>Your name, position, hire date, and pay rate.</li>
        <li>Government IDs used for payroll: TIN, SSS, PhilHealth, Pag-IBIG.</li>
        <li>Your time entries, shift schedules, and payslips.</li>
        <li>Your login email, if you were given a self-service account.</li>
      </ul>
      <h2>Why it&apos;s processed</h2>
      <p>
        Solely to run your employment: computing pay, statutory contributions,
        withholding tax, and providing you access to your own schedules and
        payslips. PondoFlow never uses employee data for advertising.
      </p>
      <h2>Who can see your data</h2>
      <p>
        Only authorized users in your company (owners and managers) and you.
        Other employees cannot see your records, and other companies on
        PondoFlow are fully isolated from yours.
      </p>
      <h2>Questions or requests</h2>
      <p>
        For corrections or access requests, contact your employer&apos;s HR or
        payroll administrator first. You may also reach PondoFlow&apos;s Data
        Protection Officer at privacy@pondoflow.ph, or the National Privacy
        Commission at privacy.gov.ph.
      </p>
    </LegalPage>
  );
}
