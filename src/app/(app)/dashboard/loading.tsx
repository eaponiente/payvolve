export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <div className="h-7 w-40 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-56 rounded bg-zinc-100" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-zinc-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="mt-3 h-6 w-16 rounded bg-zinc-200" />
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="divide-y divide-zinc-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-4 w-32 rounded bg-zinc-200" />
              <div className="mt-2 h-3 w-48 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
