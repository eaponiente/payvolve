export default function EmployeesLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <div className="h-7 w-32 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-24 rounded bg-zinc-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-zinc-200" />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="h-3 w-full max-w-md rounded bg-zinc-200" />
        </div>
        <div className="divide-y divide-zinc-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4">
              <div className="h-4 w-32 rounded bg-zinc-200" />
              <div className="h-4 w-20 rounded bg-zinc-100" />
              <div className="h-4 w-16 rounded bg-zinc-100" />
              <div className="ml-auto h-4 w-16 rounded bg-zinc-100" />
              <div className="h-5 w-16 rounded-full bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
