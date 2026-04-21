export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
      <div className="flex items-start gap-4">
        <div className="size-16 animate-pulse rounded-xl bg-white/5" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}
