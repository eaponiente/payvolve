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

export default async function ContactMessagesPage() {
  await requireDev();

  // No tenant — contact messages come from the public marketing site.
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Contact messages"
        subtitle={`${messages.length} message(s) · dev-only view`}
        action={<Badge tone="amber">Dev</Badge>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Date</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Company</Th>
              <Th>Message</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {messages.map((m) => (
              <tr key={m.id} className="align-top hover:bg-zinc-50">
                <Td className="whitespace-nowrap text-zinc-500">
                  {dateFmt.format(m.createdAt)}
                </Td>
                <Td className="font-medium">{m.name}</Td>
                <Td className="text-zinc-500">{m.email}</Td>
                <Td className="text-zinc-500">{m.company || "—"}</Td>
                <Td className="max-w-md whitespace-pre-wrap text-zinc-700">
                  {m.message}
                </Td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  No contact messages yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
