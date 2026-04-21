// Typed client for the FastAPI backend. Mirrors the Pydantic response models
// in backend/routers/{polymarket,ai}.py. Use BASE_URL from env in both
// server- and client-side components — Next 15 inlines NEXT_PUBLIC_* at build.

export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:10000";

// --- Shared enums matching the backend Literals ---

export type MarketCategory =
  | "politics"
  | "crypto"
  | "sports"
  | "tech"
  | "culture"
  | "economics"
  | "other";

export type HistoryInterval = "1h" | "6h" | "1d" | "1w" | "1m" | "all" | "max";

// --- Response shapes (1:1 with backend Pydantic models) ---

export interface MarketCard {
  slug: string;
  question: string;
  category: MarketCategory;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  liquidity: number;
  change24h: number;
  endDate: string | null;
  image: string | null;
}

export interface MarketDetail extends MarketCard {
  description: string | null;
  outcomes: string[];
  totalVolume: number;
  createdAt: string | null;
  conditionId: string | null;
  clobTokenIds: string[];
  eventTitle: string | null;
  eventTicker: string | null;
  oneHourPriceChange: number;
  oneWeekPriceChange: number;
  oneMonthPriceChange: number;
}

export interface HistoryPoint {
  t: number;
  yes: number;
}

export interface MarketHistoryResponse {
  slug: string;
  interval: string;
  points: HistoryPoint[];
}

export interface RelatedTicker {
  symbol: string;
  relevance: number;
  rationale: string | null;
}

export interface RelatedTickersResponse {
  slug: string;
  tickers: RelatedTicker[];
  provider: string | null;
  fallbackUsed: boolean | null;
  cachedAt: string | null;
}

export interface CategoryCount {
  category: MarketCategory;
  count: number;
}

export interface CategoriesResponse {
  categories: CategoryCount[];
}

export interface MarketListResponse {
  markets: MarketCard[];
  total: number;
}

export interface MarketTake {
  slug: string;
  mispriced: boolean;
  direction: "yes" | "no" | "neutral";
  confidence: number;
  summary: string;
  yesNeeds: string[];
  noNeeds: string[];
  provider: string | null;
  fallbackUsed: boolean | null;
  cachedAt: string | null;
}

export interface DailyBrief {
  headline: string;
  body: string;
  provider: string | null;
  fallbackUsed: boolean | null;
  cachedAt: string | null;
}

// --- Fetch helpers ---

interface FetchOptions {
  signal?: AbortSignal;
  // Next-specific revalidation hints. Default: no cache — backend is the
  // source of truth and already TTL-caches upstream (see M4).
  revalidate?: number | false;
}

async function getJSON<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${BACKEND_BASE_URL}${path}`;
  const next: { revalidate?: number } = {};
  if (typeof opts.revalidate === "number") next.revalidate = opts.revalidate;

  const res = await fetch(url, {
    signal: opts.signal,
    ...(opts.revalidate === false
      ? { cache: "no-store" as const }
      : { next }),
  });

  if (!res.ok) {
    let detail: string;
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new BackendError(res.status, detail || res.statusText);
  }
  return (await res.json()) as T;
}

export class BackendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "BackendError";
  }
}

// Cold-start detector — Render's free tier sleeps after 15 min idle and the
// first request that wakes it hangs or gets a 502/503/504 from the Render
// proxy before the Python process is ready. AbortError from our own retry
// also looks like this to the user. The hint / retry UI reads this to swap
// copy from "Couldn't load data" to "Backend is waking up".
export function isLikelyColdStart(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof BackendError) {
    return err.status === 502 || err.status === 503 || err.status === 504 || err.status === 0;
  }
  if (err instanceof Error) {
    const name = err.name;
    if (name === "AbortError" || name === "TimeoutError") return true;
    const msg = err.message.toLowerCase();
    if (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("fetch failed") ||
      msg.includes("timeout") ||
      msg.includes("econnrefused") ||
      msg.includes("load failed")
    ) {
      return true;
    }
  }
  return false;
}

// --- Polymarket endpoints ---

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function fetchTrending(
  opts: { limit?: number; category?: MarketCategory; signal?: AbortSignal } = {},
): Promise<MarketListResponse> {
  return getJSON<MarketListResponse>(
    `/polymarket/trending${qs({ limit: opts.limit, category: opts.category })}`,
    { signal: opts.signal, revalidate: 30 },
  );
}

export function fetchMovers(
  opts: { limit?: number; category?: MarketCategory; signal?: AbortSignal } = {},
): Promise<MarketListResponse> {
  return getJSON<MarketListResponse>(
    `/polymarket/movers${qs({ limit: opts.limit, category: opts.category })}`,
    { signal: opts.signal, revalidate: 30 },
  );
}

export function fetchCategories(
  opts: { signal?: AbortSignal } = {},
): Promise<CategoriesResponse> {
  return getJSON<CategoriesResponse>("/polymarket/categories", {
    signal: opts.signal,
    revalidate: 60,
  });
}

export function fetchSearch(
  opts: { q?: string; category?: MarketCategory; limit?: number; signal?: AbortSignal } = {},
): Promise<MarketListResponse> {
  return getJSON<MarketListResponse>(
    `/polymarket/search${qs({ q: opts.q, category: opts.category, limit: opts.limit })}`,
    { signal: opts.signal, revalidate: 30 },
  );
}

export function fetchMarket(
  slug: string,
  opts: { signal?: AbortSignal } = {},
): Promise<MarketDetail> {
  return getJSON<MarketDetail>(`/polymarket/market/${encodeURIComponent(slug)}`, {
    signal: opts.signal,
    revalidate: 30,
  });
}

export function fetchMarketHistory(
  slug: string,
  opts: { interval?: HistoryInterval; signal?: AbortSignal } = {},
): Promise<MarketHistoryResponse> {
  return getJSON<MarketHistoryResponse>(
    `/polymarket/market/${encodeURIComponent(slug)}/history${qs({ interval: opts.interval })}`,
    { signal: opts.signal, revalidate: 120 },
  );
}

export function fetchRelatedTickers(
  slug: string,
  opts: { signal?: AbortSignal } = {},
): Promise<RelatedTickersResponse> {
  return getJSON<RelatedTickersResponse>(
    `/polymarket/market/${encodeURIComponent(slug)}/related-tickers`,
    { signal: opts.signal, revalidate: 3600 },
  );
}

// --- AI endpoints ---

export function fetchMarketTake(
  slug: string,
  opts: { signal?: AbortSignal } = {},
): Promise<MarketTake> {
  return getJSON<MarketTake>(`/ai/market-take/${encodeURIComponent(slug)}`, {
    signal: opts.signal,
    revalidate: 1800,
  });
}

export function fetchDailyBrief(
  opts: { signal?: AbortSignal } = {},
): Promise<DailyBrief> {
  return getJSON<DailyBrief>("/ai/daily-brief", {
    signal: opts.signal,
    revalidate: 1800,
  });
}
