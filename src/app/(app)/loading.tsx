export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="h-7 w-40 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-56 rounded bg-zinc-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-zinc-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="mt-3 h-5 w-14 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
