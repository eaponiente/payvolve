import { prisma } from "@/lib/db";
import { requireDev } from "@/lib/dev";
import { Badge, Card, PageHeader, Td, Th } from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function BugReportsPage() {
  await requireDev();

  // Cross-tenant: devs see every report. Join company names for context.
  const [reports, companies] = await Promise.all([
    prisma.bugReport.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.company.findMany({ select: { id: true, name: true } }),
  ]);
  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Bug reports"
        subtitle={`${reports.length} report(s) · dev-only view across all companies`}
        action={<Badge tone="amber">Dev</Badge>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Reported</Th>
              <Th>Name</Th>
              <Th>Details</Th>
              <Th>Reporter</Th>
              <Th>Company</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {reports.map((r) => (
              <tr key={r.id} className="align-top hover:bg-zinc-50">
                <Td className="whitespace-nowrap text-zinc-500">
                  {dateFmt.format(r.createdAt)}
                </Td>
                <Td className="font-medium">{r.name}</Td>
                <Td className="max-w-md whitespace-pre-wrap text-zinc-700">
                  {r.feedback}
                </Td>
                <Td className="text-zinc-500">{r.reporterEmail || "—"}</Td>
                <Td className="text-zinc-500">
                  {r.companyId ? (companyName.get(r.companyId) ?? "—") : "—"}
                </Td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  No bug reports yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
