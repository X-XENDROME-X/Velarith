<h1 align="center"> Velarith 🐂 </h1>

<p align="center">
  <img src="public/images/logo.jpg" alt="Velarith" width="280" />
</p>

Velarith is an AI-powered prediction market research tool built at the ASU Claude Builder Club Hackathon, Fall 2025. It pulls live market data, overlays stock technicals, fundamentals, and sentiment analysis, and lets you query a Claude-powered assistant with real market context already loaded in. The goal is to take a prediction market question and give you enough information to form a confident, reasoned position.

## Pages

**Dashboard** (`/dashboard`) — An overview of what is moving right now. Shows the top markets by 24h odds shift, trending markets by volume, an AI-generated daily brief from the active market landscape, and a live snapshot of your watchlist.

**Market Discovery** (`/markets`) — Browse and search open markets by category (politics, crypto, sports, tech, culture, economics). A separate watchlist tab shows your saved markets with live YES/NO odds and saved tickers with live quotes.

**Market Detail** (`/markets/[slug]`) — Per-market deep dive. Current YES/NO odds, a full odds history chart across 1D/1W/1M/All intervals, an AI verdict on whether the market looks mispriced, and a panel of related equities with live prices and a brief technical/fundamental/sentiment summary each.

**Research** (`/research`) — Stock research as supporting evidence. TradingView live chart, full technical indicator breakdown (RSI, MACD, SMA 10/50/200), fundamental metrics, Google Trends sentiment, and an AI write-up with a BUY/SELL/HOLD recommendation. Deeplinks back to related prediction markets.

**Assistant** (`/assistant`) — Streaming AI chat powered by Claude Sonnet 4.5 and Groq Llama 3.3 70B. Every session gets live index prices (SPY, QQQ, DIA, IWM) injected as context. Deeplinks from Market Detail and Research pre-load the relevant market or ticker data before the first message.

## Stack

### Frontend

| | |
|---|---|
| Framework | Next.js 15, React 19, TypeScript 5 |
| Styling | Tailwind CSS 3, Radix UI, shadcn/ui |
| AI streaming | Vercel AI SDK 6 |
| Charts | TradingView widget (live), Recharts 3 (odds history) |
| State | Zustand 5, TanStack Query 5 |
| Markdown | react-markdown, remark-gfm |
| Fonts | Geist (Vercel) |

### Backend

| | |
|---|---|
| Framework | FastAPI 0.12x, uvicorn |
| Language | Python 3.11+ |
| Market data | httpx, cachetools (TTL in-memory cache) |
| Stock data | yfinance, ta (technical indicators) |
| Sentiment | pytrends (Google Trends) |
| AI | anthropic, groq |
| Validation | Pydantic 2 |

### Data sources

| Source | Used for |
|---|---|
| Prediction market Gamma REST API | Market listings, categories, search, movers, trending |
| Prediction market CLOB REST API | Per-market odds price history |
| Finnhub | Real-time stock quotes (ticker tape, watchlist, evidence panels) |
| Yahoo Finance | Historical data, fundamentals, ticker search |
| Google Trends | Sentiment scoring for research |
| TradingView widget | Live candlestick chart in Research |

### Infrastructure

- Vercel (frontend + serverless functions)
- Render (FastAPI backend)

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Anthropic API key
- Finnhub API key
- Groq API key

### Frontend

```bash
git clone https://github.com/X-XENDROME-X/Velarith.git
cd Velarith
npm install
```

Create `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=your_key
FINNHUB_API_KEY=your_key
GROQ_API_KEY=your_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:10000
```

```bash
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv env
source env/bin/activate   # Windows: env\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_key
GROQ_API_KEY=your_key
FINNHUB_API_KEY=your_key
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

Auto-generated API docs are at `http://localhost:10000/docs`.

To run both servers at once:

```bash
npm run dev:all
```

### Deployment

The repo includes a `render.yaml` Blueprint for one-click deployment of the FastAPI backend to Render. Set `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `FINNHUB_API_KEY`, and `ALLOWED_ORIGINS` as environment variables in the Render dashboard. The frontend deploys to Vercel via the standard GitHub integration with the same env vars added there.

## Team

| | |
|---|---|
| **Shorya Raj** | [github.com/X-XENDROME-X](https://github.com/X-XENDROME-X) |
| **Pranjal Shrivatava** | [github.com/Lossul](https://github.com/Lossul) |
| **Abhinav Ranish** | [github.com/Abhinav-ranish](https://github.com/Abhinav-ranish) |
| **Anshuman Yadav** | [github.com/ayadav75](https://github.com/ayadav75) |
| **Emeka** | [github.com/Ekwenibe](https://github.com/Ekwenibe) |

## Disclaimer

Velarith is provided for informational and research purposes only. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other kind of advice. Market analysis, AI-generated summaries, and sentiment scores are tools to assist your own research — they are not recommendations to buy, sell, or hold any asset or position. Always consult a qualified financial professional before making any investment or trading decisions. Past market behavior is not indicative of future results.

## License

MIT License. Copyright (c) 2025 Team Velarith.
