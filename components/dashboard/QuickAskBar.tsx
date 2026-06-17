"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight } from "lucide-react";

export function QuickAskBar() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push(`/assistant?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      {/* Change start: stack the quick ask form on narrow phones */}
      <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80 min-[380px]:text-[11px] min-[380px]:tracking-[0.2em]">
        <MessageSquare className="size-3.5 shrink-0" />
        Ask the assistant
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(prompt);
        }}
        className="mt-3 flex min-w-0 flex-col gap-2 min-[480px]:flex-row"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about a market, ticker, or thesis…"
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoComplete="off"
          className="min-h-[44px] w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white placeholder-white/40 backdrop-blur-sm transition focus:border-cyan-500/50 focus:bg-white/10 focus:outline-none sm:text-sm"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-teal-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:w-auto"
        >
          Ask <ArrowRight className="size-4" />
        </button>
      </form>
      {/* Change end: stack the quick ask form on narrow phones */}
    </div>
  );
}
