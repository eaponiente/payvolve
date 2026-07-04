import type { ReactNode } from "react";
import { MarketingNav } from "./nav";
import { MarketingFooter } from "./footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {updated && <p className="mt-2 text-sm text-zinc-400">Last updated: {updated}</p>}
        <div className="prose-sm mt-8 space-y-6 leading-relaxed text-zinc-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
