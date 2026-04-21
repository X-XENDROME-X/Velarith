"use client";

import { useCallback, useEffect, useState } from "react";

// Watchlist state lives in localStorage in v1. v2 swaps this hook's internals
// for a Supabase query; callers don't change. The shape is intentionally small
// — snapshot fields (question, category) are cached for instant UI but never
// treated as authoritative (the live `/polymarket/market/{slug}` call wins).

const STORAGE_KEY = "velarith:watchlist:v1";

export interface WatchlistMarket {
  slug: string;
  question: string;
  category: string;
  addedAt: number;
}

export interface WatchlistTicker {
  symbol: string;
  addedAt: number;
}

export interface WatchlistState {
  markets: WatchlistMarket[];
  tickers: WatchlistTicker[];
}

const EMPTY: WatchlistState = { markets: [], tickers: [] };

function readStorage(): WatchlistState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<WatchlistState>;
    return {
      markets: Array.isArray(parsed.markets) ? parsed.markets : [],
      tickers: Array.isArray(parsed.tickers) ? parsed.tickers : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeStorage(state: WatchlistState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage quota / private mode — silent fail is fine for a watchlist
  }
}

// Cross-tab sync: emit a custom event on every write, listen on the same event.
const SYNC_EVENT = "velarith:watchlist:update";

export function useWatchlist() {
  const [state, setState] = useState<WatchlistState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);

    const onUpdate = () => setState(readStorage());
    window.addEventListener(SYNC_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(SYNC_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const persist = useCallback((next: WatchlistState) => {
    setState(next);
    writeStorage(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    }
  }, []);

  const addMarket = useCallback(
    (market: Omit<WatchlistMarket, "addedAt">) => {
      const current = readStorage();
      if (current.markets.some((m) => m.slug === market.slug)) return;
      const next: WatchlistState = {
        ...current,
        markets: [{ ...market, addedAt: Date.now() }, ...current.markets],
      };
      persist(next);
    },
    [persist],
  );

  const removeMarket = useCallback(
    (slug: string) => {
      const current = readStorage();
      persist({ ...current, markets: current.markets.filter((m) => m.slug !== slug) });
    },
    [persist],
  );

  const toggleMarket = useCallback(
    (market: Omit<WatchlistMarket, "addedAt">) => {
      const current = readStorage();
      const exists = current.markets.some((m) => m.slug === market.slug);
      if (exists) {
        persist({ ...current, markets: current.markets.filter((m) => m.slug !== market.slug) });
      } else {
        persist({
          ...current,
          markets: [{ ...market, addedAt: Date.now() }, ...current.markets],
        });
      }
      return !exists;
    },
    [persist],
  );

  const isMarketSaved = useCallback(
    (slug: string) => state.markets.some((m) => m.slug === slug),
    [state.markets],
  );

  const addTicker = useCallback(
    (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      if (!upper) return;
      const current = readStorage();
      if (current.tickers.some((t) => t.symbol === upper)) return;
      persist({
        ...current,
        tickers: [{ symbol: upper, addedAt: Date.now() }, ...current.tickers],
      });
    },
    [persist],
  );

  const removeTicker = useCallback(
    (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      const current = readStorage();
      persist({ ...current, tickers: current.tickers.filter((t) => t.symbol !== upper) });
    },
    [persist],
  );

  const toggleTicker = useCallback(
    (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      if (!upper) return false;
      const current = readStorage();
      const exists = current.tickers.some((t) => t.symbol === upper);
      if (exists) {
        persist({ ...current, tickers: current.tickers.filter((t) => t.symbol !== upper) });
      } else {
        persist({
          ...current,
          tickers: [{ symbol: upper, addedAt: Date.now() }, ...current.tickers],
        });
      }
      return !exists;
    },
    [persist],
  );

  const isTickerSaved = useCallback(
    (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      return state.tickers.some((t) => t.symbol === upper);
    },
    [state.tickers],
  );

  const clear = useCallback(() => persist(EMPTY), [persist]);

  return {
    markets: state.markets,
    tickers: state.tickers,
    hydrated,
    addMarket,
    removeMarket,
    toggleMarket,
    isMarketSaved,
    addTicker,
    removeTicker,
    toggleTicker,
    isTickerSaved,
    clear,
  };
}
