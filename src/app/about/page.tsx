import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "About us",
  description:
    "PondoFlow builds payroll software for Philippine businesses — SSS, PhilHealth, Pag-IBIG, and BIR compliance built in, made for teams that run semi-monthly payroll.",
};

export default function AboutPage() {
  return (
    <LegalPage title="About PondoFlow">
      <p>
        PondoFlow was born out of payroll nights that ended at 3 AM — spreadsheets,
        contribution tables copied from Facebook groups, and the quiet fear of a
        BIR mismatch. We believe Philippine small businesses deserve payroll
        software that understands <em>Philippine</em> payroll: semi-monthly
        cutoffs, SSS brackets, PhilHealth premiums, Pag-IBIG, TRAIN-law
        withholding, overtime at 125%, night differential after 10 PM, and the
        13th-month pay everyone counts on in December.
      </p>
      <h2>What we build</h2>
      <p>
        One app that carries a team from <strong>scheduled</strong> to{" "}
        <strong>clocked-in</strong> to <strong>paid</strong>: shift scheduling,
        mobile time tracking, automated payroll runs, payslips, and
        BIR-friendly reports — with statutory tables kept current so you never
        have to hunt for the latest circular again.
      </p>
      <h2>Who it&apos;s for</h2>
      <p>
        We designed PondoFlow with food &amp; beverage teams in mind — overnight
        closing shifts, split schedules, daily-rate crew — but it fits any
        Philippine business that runs semi-monthly payroll.
      </p>
      <h2>Talk to us</h2>
      <p>
        We&apos;re a small team and we read everything. Reach us through the{" "}
        <Link href="/#contact" className="text-emerald-700 underline">
          contact form
        </Link>{" "}
        or at support@pondoflow.com.
      </p>
    </LegalPage>
  );
}
