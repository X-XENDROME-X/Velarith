import Link from "next/link";

export default function MarketNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white">Market not found</h1>
      <p className="mt-2 text-sm text-white/60">
        This market may have resolved, been delisted, or the link is mistyped.
      </p>
      <Link
        href="/markets"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
      >
        Browse markets
      </Link>
    </div>
  );
}
