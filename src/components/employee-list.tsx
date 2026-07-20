"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { phpFormat } from "@/lib/payroll/money";
import { Badge, Card, Input, Td, Th } from "@/components/ui";

export type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  payType: "MONTHLY" | "DAILY" | "HOURLY";
  baseRate: number;
  active: boolean;
};

const PAY_TYPE_LABEL = {
  MONTHLY: "Monthly",
  DAILY: "Daily",
  HOURLY: "Hourly",
} as const;

const TABS = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "all", label: "All" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function EmployeeList({ employees }: { employees: EmployeeRow[] }) {
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (tab === "active" && !e.active) return false;
      if (tab === "inactive" && e.active) return false;
      if (!q) return true;
      return (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      );
    });
  }, [employees, tab, query]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            type="search"
            placeholder="Search name or position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Name</Th>
              <Th>Position</Th>
              <Th>Pay</Th>
              <Th className="text-right">Rate</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <Td>
                  <Link
                    href={`/employees/${e.id}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {e.lastName}, {e.firstName}
                  </Link>
                </Td>
                <Td className="text-zinc-500">{e.position || "—"}</Td>
                <Td>{PAY_TYPE_LABEL[e.payType]}</Td>
                <Td className="text-right tabular-nums">{phpFormat(e.baseRate)}</Td>
                <Td>
                  {e.active ? (
                    <Badge tone="emerald">Active</Badge>
                  ) : (
                    <Badge>Inactive</Badge>
                  )}
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  {employees.length === 0
                    ? "No employees yet. Add your first crew member."
                    : "No employees match your filter."}
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
