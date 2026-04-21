"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight } from "lucide-react";

const SUGGESTIONS = [
  "What's the market saying about the next Fed meeting?",
  "Which crypto market looks most mispriced?",
  "Should I trust the Iran peace deal market?",
];

export function QuickAskBar() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push(`/assistant?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
        <MessageSquare className="size-3.5" />
        Ask the assistant
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(prompt);
        }}
        className="mt-3 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about a market, a ticker, or a thesis…"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-cyan-500/50 focus:bg-white/10 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask <ArrowRight className="size-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/60 transition hover:border-white/20 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
