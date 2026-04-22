"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { ChatInput } from "@/components/ai/ChatInput";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import {
  Sparkles,
  AlertCircle,
  Trash2,
  Download,
  Loader2,
  X,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ProviderInfo {
  provider: string;
  model: string;
  fallbackUsed: boolean;
}

function AssistantPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketSlug = searchParams.get("market");
  const ticker = searchParams.get("ticker");
  const urlPrompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autofiredRef = useRef(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setStreamingContent("");

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          marketSlug: marketSlug ?? null,
          ticker: ticker ?? null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Capture provider headers for the badge.
      const prov = response.headers.get("X-AI-Provider");
      if (prov) {
        setProvider({
          provider: prov,
          model: response.headers.get("X-AI-Model") ?? "",
          fallbackUsed: response.headers.get("X-AI-Fallback-Used") === "true",
        });
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let responseIncomplete = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              }
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.done && parsed.incomplete) responseIncomplete = true;
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e;
              }
            }
          }
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          fullContent +
          (responseIncomplete
            ? "\n\n⚠️ *Response truncated — ask a follow-up for more detail.*"
            : ""),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent("");
      setIsIncomplete(responseIncomplete);
      if (responseIncomplete) {
        setError("Response truncated due to length.");
        setTimeout(() => setError(null), 8000);
      }
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e.name === "AbortError") return;
      console.error("Chat error:", err);
      setError(e.message || "Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-fire once: explicit ?prompt= from the dashboard bar, or ?market= / ?ticker= deeplinks.
  useEffect(() => {
    if (autofiredRef.current) return;
    if (messages.length > 0) return;

    const explicit = urlPrompt?.trim();
    if (explicit) {
      autofiredRef.current = true;
      const next = new URLSearchParams();
      if (marketSlug) next.set("market", marketSlug);
      if (ticker) next.set("ticker", ticker);
      const qs = next.toString();
      router.replace(qs ? `/assistant?${qs}` : "/assistant", { scroll: false });
      void handleSendMessage(explicit);
      return;
    }

    if (!marketSlug && !ticker) return;
    autofiredRef.current = true;
    const prompt = marketSlug
      ? `What do you think about this market? Is it mispriced? Walk me through your take, the evidence, and what would change your mind.`
      : `Analyze $${ticker?.toUpperCase()} as evidence for any related prediction-market bets. Start with technicals + fundamentals, then connect to markets where this ticker matters.`;
    void handleSendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketSlug, ticker, urlPrompt, router]);

  const handlePromptSelect = (prompt: string) => handleSendMessage(prompt);

  const handleClearChat = () => {
    if (confirm("Clear all messages?")) {
      setMessages([]);
      setError(null);
      setStreamingContent("");
    }
  };

  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === "user" ? "You" : "Velarith AI";
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join("\n---\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velarith-chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateLastResponse = () => {
    const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const trimmed = messages.slice(0, lastUserIdx + 1);
    setMessages(trimmed);
    handleSendMessage(messages[lastUserIdx].content);
  };

  const handleContinueResponse = () => {
    handleSendMessage(
      "Please continue from where you left off and complete your analysis.",
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamingContent]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/5 bg-card/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Assistant
            </p>
            <h1 className="text-xl font-semibold sm:text-2xl">Velarith Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask market questions with focused, evidence-backed context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {provider && <ProviderBadge info={provider} />}
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleExportChat}
                  className="rounded-lg border border-white/10 bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-cyan-500/30 hover:bg-card/80 hover:text-cyan-400"
                  title="Export chat"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClearChat}
                  className="rounded-lg border border-white/10 bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-red-500/30 hover:bg-card/80 hover:text-red-400"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {(marketSlug || ticker) && (
          <div className="relative mt-3">
            <ContextPill marketSlug={marketSlug} ticker={ticker} />
          </div>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_55%)]" />
        <div className="relative h-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
                <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-900/40 via-slate-900/70 to-purple-900/40 p-8 text-center shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_60%)]" />
                  <div className="relative space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-white/5">
                      <Sparkles className="h-8 w-8 text-cyan-300" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Ask market questions with Velarith Assistant
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-muted-foreground/80 sm:text-lg">
                      Explore prediction markets with context from equities and macro signals.
                      Open this page with <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm">?market=slug</code>{" "}
                      or <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm">?ticker=SYM</code> to start with focused context.
                    </p>
                  </div>
                </div>
                <SuggestedPrompts
                  className="max-w-4xl"
                  onPromptSelect={handlePromptSelect}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-6">
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
                    <div className="flex-1">
                      <h4 className="mb-1 text-sm font-semibold text-rose-200">Error</h4>
                      <p className="text-sm text-rose-300/90">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-sm text-rose-400 hover:text-rose-300"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="space-y-6 rounded-3xl border border-white/5 bg-card/70 p-4 shadow-xl shadow-black/20 sm:p-6">
                  {messages.map((message, idx) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onRegenerate={
                        message.role === "assistant" &&
                        idx === messages.length - 1 &&
                        !isLoading
                          ? handleRegenerateLastResponse
                          : undefined
                      }
                    />
                  ))}

                  {streamingContent && (
                    <ChatMessage
                      message={{
                        id: "streaming",
                        role: "assistant",
                        content: streamingContent,
                        timestamp: new Date(),
                      }}
                    />
                  )}

                  {isLoading && !streamingContent && (
                    <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 px-5 py-4">
                      <div className="relative flex h-8 w-8 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                        <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-200">
                          Velarith AI is thinking...
                        </p>
                        <p className="text-xs text-cyan-300/60">
                          Pulling market data and weighing evidence
                        </p>
                      </div>
                    </div>
                  )}

                  {isIncomplete && !isLoading && (
                    <div className="flex animate-in fade-in slide-in-from-bottom-2 justify-center duration-300">
                      <button
                        onClick={handleContinueResponse}
                        className="group flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-200 shadow-lg transition-all hover:border-cyan-400/50 hover:from-cyan-500/20 hover:via-teal-500/20 hover:to-cyan-500/20"
                      >
                        <Sparkles className="h-4 w-4 text-cyan-400 group-hover:animate-pulse" />
                        Continue Response
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

function ProviderBadge({ info }: { info: ProviderInfo }) {
  const label =
    info.provider === "anthropic"
      ? "Claude"
      : info.provider === "groq"
      ? "Groq"
      : info.provider;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold " +
        (info.fallbackUsed
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200")
      }
      title={info.model}
    >
      <Sparkles className="h-3 w-3" />
      {label}
      {info.fallbackUsed && " · fallback"}
    </span>
  );
}

function ContextPill({
  marketSlug,
  ticker,
}: {
  marketSlug: string | null;
  ticker: string | null;
}) {
  if (marketSlug) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
        <span className="font-semibold">Market context:</span>
        <Link
          href={`/markets/${marketSlug}`}
          className="underline-offset-2 hover:underline"
        >
          {marketSlug}
        </Link>
        <Link
          href="/assistant"
          className="ml-1 rounded-full p-0.5 text-cyan-300/70 hover:bg-white/10 hover:text-white"
          title="Clear context"
        >
          <X className="h-3 w-3" />
        </Link>
      </div>
    );
  }
  if (ticker) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
        <span className="font-semibold">Ticker context:</span>
        <Link
          href={`/research?ticker=${ticker.toUpperCase()}`}
          className="underline-offset-2 hover:underline"
        >
          ${ticker.toUpperCase()}
        </Link>
        <Link
          href="/assistant"
          className="ml-1 rounded-full p-0.5 text-cyan-300/70 hover:bg-white/10 hover:text-white"
          title="Clear context"
        >
          <X className="h-3 w-3" />
        </Link>
      </div>
    );
  }
  return null;
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <AssistantPageInner />
    </Suspense>
  );
}
