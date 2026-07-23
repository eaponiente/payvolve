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

type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  fbclid: string | null;
  gclid: string | null;
  referrer: string | null;
};

/** Best available human-readable source label for a signup. */
function sourceLabel(c: Attribution): string {
  if (c.utmSource) return c.utmSource;
  if (c.fbclid) return "facebook";
  if (c.gclid) return "google (ads)";
  if (c.referrer) {
    try {
      return new URL(c.referrer).hostname.replace(/^www\./, "");
    } catch {
      return c.referrer;
    }
  }
  return "Direct / organic";
}

export default async function AttributionPage() {
  await requireDev();

  // No tenant filter — this is a cross-company dev view of signup sources.
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      fbclid: true,
      gclid: true,
      referrer: true,
      landingPath: true,
    },
  });

  const attributed = companies.filter(
    (c) => c.utmSource || c.fbclid || c.gclid || c.referrer,
  ).length;

  return (
    <>
      <PageHeader
        title="Signup attribution"
        subtitle={`${companies.length} companies · ${attributed} with a known source · first-touch`}
        action={<Badge tone="amber">Dev</Badge>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Signed up</Th>
              <Th>Company</Th>
              <Th>Source</Th>
              <Th>Medium</Th>
              <Th>Campaign</Th>
              <Th>Referrer</Th>
              <Th>Landing</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {companies.map((c) => (
              <tr key={c.id} className="align-top hover:bg-zinc-50">
                <Td className="whitespace-nowrap text-zinc-500">
                  {dateFmt.format(c.createdAt)}
                </Td>
                <Td className="font-medium">{c.name}</Td>
                <Td>
                  <span className="font-medium text-zinc-800">{sourceLabel(c)}</span>
                </Td>
                <Td className="text-zinc-500">{c.utmMedium || "—"}</Td>
                <Td className="text-zinc-500">{c.utmCampaign || "—"}</Td>
                <Td className="max-w-xs truncate text-zinc-500">{c.referrer || "—"}</Td>
                <Td className="text-zinc-500">{c.landingPath || "—"}</Td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-10 text-center text-zinc-500">
                  No companies yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
