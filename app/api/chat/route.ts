import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { getMarketContext, formatMarketContextForAI } from "@/lib/api/market-context";
import { fetchMarket, fetchMarketTake } from "@/lib/api/backend";

// --- Rate limiting (in-memory, per-IP) ---------------------------------------

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(id: string) {
  const now = Date.now();
  const cur = rateLimitMap.get(id);
  if (!cur || now > cur.resetTime) {
    rateLimitMap.set(id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  if (cur.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: cur.resetTime };
  }
  cur.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - cur.count, resetTime: cur.resetTime };
}

// --- System prompt — prediction-market first --------------------------------

const SYSTEM_PROMPT = `You are Velarith AI, an analyst specialized in **prediction markets**. The user is researching whether to buy YES or NO on a market, or sizing a position. Stocks, macro data, and news are framed as **evidence** for that bet — not as the end goal.

## How you answer
1. Lead with a direct take: is the market mispriced? YES or NO leaning? Confidence?
2. Back it up: key catalysts, historical base rates, current evidence (technicals, fundamentals, sentiment).
3. Flag what would change your mind.
4. End with: "Not financial advice — do your own research."

## Formatting
- Use ### and #### headings. Never # or ##.
- **Bold** key terms, metrics, conclusions.
- Tables for comparative data. Bullets for lists.
- Be specific: "P/E of 15 vs sector avg 22", not "good P/E".
- Give probabilities and confidence levels.

## Domain toolkit
- **Prediction markets**: implied probability vs base rate, liquidity/spread, catalysts, Kelly sizing, arb.
- **Equities as evidence**: technicals (RSI/MACD/trend), fundamentals (P/E, growth, moat), sentiment.
- **Macro**: rates, inflation, cycle position.
- **Risk**: position sizing, stop rules, correlation, scenario analysis.

Remember: your goal is to help the user make a **better bet**, not to sell a trade idea. Balance conviction with uncertainty.`;

// --- Provider resolution -----------------------------------------------------

type Provider = "anthropic" | "groq";

interface ResolvedModel {
  provider: Provider;
  modelId: string;
  model: ReturnType<ReturnType<typeof createAnthropic>> | ReturnType<ReturnType<typeof createGroq>>;
  fallbackUsed: boolean;
}

function resolveModel(): ResolvedModel | { error: string } {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicModel =
    process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-5-20250929";
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (anthropicKey && anthropicKey !== "your_api_key_here") {
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    return {
      provider: "anthropic",
      modelId: anthropicModel,
      model: anthropic(anthropicModel),
      fallbackUsed: false,
    };
  }

  if (groqKey) {
    const groq = createGroq({ apiKey: groqKey });
    return {
      provider: "groq",
      modelId: groqModel,
      model: groq(groqModel),
      fallbackUsed: true,
    };
  }

  return {
    error:
      "No AI provider configured. Set ANTHROPIC_API_KEY (primary) or GROQ_API_KEY (fallback).",
  };
}

// --- Optional market/ticker context injection --------------------------------

async function fetchMarketContextBlock(marketSlug: string): Promise<string | null> {
  try {
    const [detail, take] = await Promise.all([
      fetchMarket(marketSlug),
      fetchMarketTake(marketSlug).catch(() => null),
    ]);
    const lines = [
      `### Active market context`,
      `- **Question**: ${detail.question}`,
      `- **Category**: ${detail.category}`,
      `- **YES**: ${(detail.yesPrice * 100).toFixed(1)}% · **NO**: ${(detail.noPrice * 100).toFixed(1)}%`,
      `- **24h change**: ${(detail.change24h * 100).toFixed(1)}% · **24h volume**: $${detail.volume24h.toLocaleString()}`,
      detail.endDate ? `- **Resolves**: ${detail.endDate}` : null,
      detail.description ? `- **Description**: ${detail.description.slice(0, 400)}` : null,
    ].filter(Boolean);
    if (take) {
      lines.push(
        `- **Prior AI take**: mispriced=${take.mispriced}, direction=${take.direction}, confidence=${(take.confidence * 100).toFixed(0)}%`,
      );
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}

// --- Route handler -----------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      const resetIn = Math.ceil((rl.resetTime - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${resetIn} minutes.` },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetTime),
          },
        },
      );
    }

    const resolved = resolveModel();
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 500 });
    }

    const body = await req.json();
    const {
      messages,
      marketSlug,
      ticker,
    }: {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      marketSlug?: string | null;
      ticker?: string | null;
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    // Trim context to last 10 messages.
    const recent = messages.slice(-10);

    // Live market snapshot (indices / movers).
    const liveContext = await getMarketContext().catch(() => null);
    const liveBlock = liveContext ? formatMarketContextForAI(liveContext) : "";

    // Optional per-conversation context from deeplink.
    let deeplinkBlock = "";
    if (marketSlug) {
      const b = await fetchMarketContextBlock(marketSlug);
      if (b) deeplinkBlock = b;
    } else if (ticker) {
      deeplinkBlock = `### Active ticker context\nThe user wants to evaluate **$${ticker.toUpperCase()}** as evidence for a bet.`;
    }

    const system = [SYSTEM_PROMPT, liveBlock, deeplinkBlock]
      .filter(Boolean)
      .join("\n\n");

    const modelMessages: ModelMessage[] = recent.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = streamText({
      model: resolved.model,
      system,
      messages: modelMessages,
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    // Preserve the client's existing SSE format: {text: "..."} chunks + done + [DONE].
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`),
            );
          }
          const finish = await result.finishReason;
          const incomplete = finish === "length";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, stopReason: finish, incomplete })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg, done: true })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-AI-Provider": resolved.provider,
        "X-AI-Model": resolved.modelId,
        "X-AI-Fallback-Used": String(resolved.fallbackUsed),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.resetTime),
      },
    });
  } catch (err) {
    console.error("Chat API Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
