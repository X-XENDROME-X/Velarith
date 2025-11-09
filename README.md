<h1 align="center"> Velarith 🐂 </h1>

<p align="center">
  <img src="public/images/logo.jpg" alt="Velarith Logo" width="300" />
</p>

<div align="center">

**Enterprise-Grade AI-Powered Financial Analytics Platform**

*Revolutionizing Market Intelligence with Claude AI & Real-Time Data Fusion*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Claude AI](https://img.shields.io/badge/Claude-4.5_Sonnet-FF6B35?style=for-the-badge)](https://www.anthropic.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

**[Live Demo](https://velarith.vercel.app)** · **[Documentation](#-documentation)**

*Built for the ASU Claude Builder Club Hackathon 2025 | Polymarket x Claude Track*

</div>

---

## 🎯 Executive Summary

**Velarith** is a sophisticated financial intelligence platform that synthesizes **real-time market data** with **AI-powered analysis** to deliver institutional-grade insights. By integrating Anthropic's Claude Sonnet 4.5, advanced technical analysis, and multi-source data aggregation, Velarith empowers traders, analysts, and investors with actionable intelligence previously available only to Wall Street institutions.

### 🏆 Key Achievements

- ✅ **Real-Time AI Analysis**: Streaming responses with Claude Sonnet 4.5 (8000 token context)
- ✅ **Multi-Source Data Fusion**: Finnhub, Yahoo Finance, Polymarket, Google Trends integration
- ✅ **Professional Analytics Engine**: Python backend with 15+ technical indicators & fundamental metrics
- ✅ **Production-Ready Architecture**: Type-safe Next.js 14, modern React patterns, optimized performance
- ✅ **Institutional UX**: Responsive design, real-time streaming, markdown rendering, mobile-optimized

---

## 🚀 Core Features

### 1. 🤖 **AI Financial Assistant** - *Powered by Claude Sonnet 4.5*

<details>
<summary><b>View Technical Details</b></summary>

**Capabilities:**
- **Institutional-Quality Analysis**: 100+ specialized prompts covering technical analysis, fundamental research, risk management, and trading strategies
- **Real-Time Market Context**: Automatic injection of live SPY, QQQ, DIA, IWM prices into every conversation
- **Streaming Responses**: Server-Sent Events (SSE) for sub-second response latency
- **Advanced Prompt Engineering**: 
  - 15+ technical indicators (RSI, MACD, Bollinger Bands, EMAs, Volume Profile)
  - Trading strategies (swing, momentum, mean reversion, event trading)
  - Risk management frameworks (Kelly criterion, position sizing, stop losses)
  - Market psychology & sentiment analysis

**Features:**
- ✅ Message actions (copy, regenerate)
- ✅ Conversation export (plain text format)
- ✅ Incomplete response detection with auto-warnings
- ✅ Rate limiting (10 req/5min per IP) for cost optimization
- ✅ Markdown rendering with syntax highlighting
- ✅ Mobile-responsive chat interface

**Tech Stack:**
- `@anthropic-ai/sdk` - Official Claude API client
- `react-markdown` + `remark-gfm` - GitHub-flavored markdown support
- `@tailwindcss/typography` - Beautiful prose styling
- Server-Sent Events (SSE) for streaming

</details>

### 2. 📊 **Advanced Analytics Dashboard**

<details>
<summary><b>View Technical Details</b></summary>

**Real-Time Market Data:**
- Live stock quotes with Finnhub API integration
- Interactive TradingView-style charts (Recharts library)
- Ticker tape with live price updates
- Search functionality across 10,000+ stocks

**Technical Analysis:**
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands with volatility analysis
- EMAs (20/50/200 periods)
- Volume analysis & accumulation/distribution
- Support/resistance level identification

**Fundamental Metrics:**
- P/E ratios, EPS growth, revenue trends
- Debt ratios, profit margins, ROE
- Sector comparisons & peer analysis
- Earnings calendar integration

**AI-Powered Insights:**
- Automated technical signal generation
- Sentiment scoring from news aggregation
- Risk/reward calculations
- Position sizing recommendations

**Features:**
- ✅ Interactive chart controls (zoom, pan, timeframe selection)
- ✅ Multi-indicator overlay
- ✅ Real-time price updates
- ✅ Mobile-optimized touch controls
- ✅ Export chart data (CSV format)

</details>

### 3. 🐍 **Python Analytics Engine**

<details>
<summary><b>View Technical Details</b></summary>

**Backend Architecture:**
```
backend/
├── app.py                      # Flask server with Swagger UI
├── blueprints/
│   ├── analysis.py             # Unified analysis endpoint
│   ├── technicals.py           # Technical indicators API
│   ├── fundamentals.py         # Fundamental data API
│   ├── sentiments.py           # Sentiment analysis API
│   ├── ai_summary.py           # Claude integration
│   └── scorer.py               # Composite scoring system
```

**Technical Analysis Module:**
- `ta` library for 30+ indicators
- `yfinance` for historical data
- `scipy` for statistical analysis
- Support/resistance detection using local extrema
- Trend strength measurement (ADX)

**Sentiment Analysis:**
- Google Trends integration via `pytrends`
- News sentiment scoring
- Polymarket prediction market data
- Social media sentiment (Twitter, Reddit)

**Fundamental Analysis:**
- Yahoo Finance fundamental data
- Peer comparison utilities
- Earnings surprise analysis
- Insider trading tracking

**API Endpoints:**
- `GET /api/technicals/<ticker>` - Technical indicators
- `GET /api/fundamentals/<ticker>` - Fundamental metrics
- `GET /api/sentiment/<ticker>` - Sentiment scores
- `GET /api/analysis/<ticker>` - Unified analysis
- `POST /api/ai-summary` - Claude AI summaries

**Tech Stack:**
- `Flask` - Web framework
- `flask-cors` - CORS handling
- `pandas` - Data manipulation
- `numpy` - Numerical computing
- `ta` - Technical analysis library
- `yfinance` - Yahoo Finance API
- `anthropic` - Claude AI integration

</details>

### 4. 📱 **Modern User Experience**

<details>
<summary><b>View Technical Details</b></summary>

**Design System:**
- **Typography**: Geist Sans & Geist Mono (Vercel's font family)
- **Color Palette**: 
  - Background: `#0A0E1A` (dark)
  - Primary: `#6366F1` (indigo)
  - Success: `#10B981` (green)
  - Danger: `#EF4444` (red)
- **Animations**: Framer Motion for smooth transitions
- **Components**: shadcn/ui (Radix UI + Tailwind)

**Responsive Features:**
- Mobile-first design (breakpoints: 640px, 768px, 1024px, 1280px)
- Touch-optimized interactions
- Dynamic viewport height for mobile Safari
- Progressive enhancement
- Optimized bundle size (87.5kB first load JS)

**Performance Optimizations:**
- Server-side rendering (SSR) for SEO
- Static generation where possible
- Code splitting with Next.js
- Image optimization with next/image
- Font optimization with Geist
- Lazy loading for heavy components

**Accessibility:**
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader optimized
- ARIA labels throughout
- Focus management

</details>

---

## 🛠️ Technology Stack

### **Frontend Architecture**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2 | React framework with App Router |
| **TypeScript** | 5.0 | Type-safe development |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Framer Motion** | 11.5 | Animation library |
| **Recharts** | 2.12 | Chart visualizations |
| **React Query** | 5.56 | Server state management |
| **Zustand** | 4.5 | Client state management |
| **Radix UI** | latest | Accessible component primitives |
| **Lucide React** | 0.446 | Icon library (1,000+ icons) |

### **Backend Architecture**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Backend runtime |
| **Flask** | 3.0 | Web framework |
| **pandas** | 2.2+ | Data manipulation |
| **NumPy** | 1.26+ | Numerical computing |
| **yfinance** | 3.10+ | Yahoo Finance API client |
| **ta** | 0.11+ | Technical analysis library |
| **anthropic** | 0.18+ | Claude AI SDK |

### **APIs & Services**

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Anthropic Claude** | AI analysis & insights | Sonnet 4.5 model |
| **Finnhub** | Real-time stock quotes | REST API |
| **Yahoo Finance** | Historical data & fundamentals | yfinance library |
| **Polymarket** | Prediction market data | REST API |
| **Google Trends** | Search trend analysis | pytrends |

### **Infrastructure**

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & CDN |
| **Render** | Python backend hosting |
| **GitHub** | Version control & CI/CD |

---

##  Installation & Setup

### **Prerequisites**

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **Python** 3.11 or higher ([Download](https://www.python.org/downloads/))
- **npm** or **yarn** package manager
- **API Keys:**
  - [Anthropic API Key](https://console.anthropic.com/) (Claude AI)
  - [Finnhub API Key](https://finnhub.io/register) (Stock data - Free tier available)

### **Frontend Setup**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/X-XENDROME-X/Velarith.git
   cd Velarith
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   
   Create `.env.local` in the root directory:
   ```env
   # Required: Anthropic Claude API
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   
   # Required: Finnhub API (free tier available)
   FINNHUB_API_KEY=your_finnhub_api_key_here
   
   # Optional: Polymarket API
   NEXT_PUBLIC_POLYMARKET_API_URL=https://api.polymarket.com/v1
   
   # Optional: Backend URL (if running locally)
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### **Backend Setup (Python)**

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure backend environment variables:**
   
   Create `.env` in the `backend/` directory:
   ```env
   FLASK_ENV=development
   FLASK_APP=app.py
   
   # Anthropic API for AI summaries
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   
   # Optional: Configure CORS origins
   CORS_ORIGINS=http://localhost:3000,https://velarith.vercel.app
   ```

5. **Start Flask server:**
   ```bash
   flask run
   # or
   python app.py
   ```

   Backend will be available at [http://localhost:5000](http://localhost:5000)
   
   Swagger UI documentation: [http://localhost:5000/docs](http://localhost:5000/docs)

### **Troubleshooting**

**Frontend Issues:**
- **Port 3000 in use:** Run `npm run dev -- -p 3001` to use different port
- **Module not found:** Delete `node_modules` and `.next`, run `npm install` again
- **Type errors:** Run `npm run type-check` to see detailed TypeScript errors

**Backend Issues:**
- **Flask not found:** Ensure virtual environment is activated
- **Import errors:** Run `pip install -r requirements.txt` again
- **CORS errors:** Check `CORS_ORIGINS` in backend `.env` matches frontend URL

---

## 🚢 Deployment

### **Vercel Deployment (Frontend)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/X-XENDROME-X/Velarith)

**Automatic Deployment:**
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `FINNHUB_API_KEY`
   - `NEXT_PUBLIC_POLYMARKET_API_URL`
   - `NEXT_PUBLIC_BACKEND_URL` (your Render backend URL)
3. Deploy automatically on push to `main` branch

**Manual Deployment:**
```bash
npm run build
vercel --prod
```

### **Render Deployment (Backend)**

1. Create new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Python Version:** 3.11
4. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `FLASK_ENV=production`
   - `CORS_ORIGINS` (your Vercel frontend URL)
5. Deploy from `main` branch

### **Custom Domain Setup**

**Vercel (Frontend):**
1. Go to project settings → Domains
2. Add your custom domain (e.g., `velarith.com`)
3. Configure DNS records as shown

**Render (Backend):**
1. Go to web service → Settings
2. Add custom domain (e.g., `api.velarith.com`)
3. Point CNAME to Render's provided URL

---

## 📁 Project Structure

```
Velarith/
├── app/                        # Next.js 14 App Router
│   ├── (landing)/             # Landing page route group
│   │   └── page.tsx           # Home page (/)
│   ├── dashboard/             # Main analytics dashboard
│   │   └── page.tsx           # Dashboard view
│   ├── markets/               # Market routes
│   │   └── [id]/              # Dynamic market detail page
│   │       └── page.tsx       # /markets/[id]
│   ├── assistant/             # AI chat interface
│   │   └── page.tsx           # Full-screen AI assistant
│   ├── analytics/             # Advanced analytics views
│   │   └── page.tsx           # Analytics dashboard
│   └── api/                   # Next.js API routes (Edge)
│       ├── chat/              # Claude AI streaming endpoint
│       │   └── route.ts       # POST /api/chat
│       ├── claude/            # Additional AI endpoints
│       └── polymarket/        # Polymarket proxy API
├── backend/                    # Python Flask backend
│   ├── app.py                 # Flask server entry point
│   ├── requirements.txt       # Python dependencies
│   ├── blueprints/            # Flask blueprints
│   │   ├── analysis.py        # Unified analysis endpoint
│   │   ├── technicals.py      # Technical indicators
│   │   ├── fundamentals.py    # Fundamental metrics
│   │   ├── sentiments.py      # Sentiment analysis
│   │   ├── ai_summary.py      # Claude integration
│   │   ├── technical/         # Technical analysis modules
│   │   │   └── core.py        # Indicator computation
│   │   ├── fundamental/       # Fundamental analysis modules
│   │   │   └── core.py        # Metrics fetching
│   │   └── sentiment/         # Sentiment analysis modules
│   │       └── gtrends.py     # Google Trends integration
│   └── docs/                  # Backend documentation
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx         # Button component
│   │   ├── card.tsx           # Card component
│   │   ├── input.tsx          # Input component
│   │   └── ...                # Other UI primitives
│   ├── layout/                # Layout components
│   │   ├── Navbar.tsx         # Main navigation
│   │   ├── Footer.tsx         # Footer
│   │   └── Sidebar.tsx        # Dashboard sidebar
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── MarketStats.tsx    # Market statistics cards
│   │   ├── TrendChart.tsx     # Trend visualization
│   │   └── MarketTable.tsx    # Live market feed
│   ├── markets/               # Market detail components
│   │   ├── PriceChart.tsx     # Historical price chart
│   │   └── OrderBook.tsx      # Order book display
│   ├── ai/                    # AI chat components
│   │   ├── ChatMessage.tsx    # Individual message
│   │   ├── ChatInput.tsx      # Message input
│   │   └── SuggestedPrompts.tsx # Prompt cards
│   └── analytics/             # Analytics visualizations
│       ├── Heatmap.tsx        # Market heatmap
│       └── ScoreIndicatorsView.tsx # Technical indicators
├── lib/                        # Utilities and helpers
│   ├── api/                   # API clients
│   │   ├── market-context.ts  # Finnhub integration
│   │   └── polymarket.ts      # Polymarket client
│   ├── types/                 # TypeScript type definitions
│   │   ├── market.ts          # Market data types
│   │   └── analysis.ts        # Analysis result types
│   ├── utils/                 # Helper functions
│   │   ├── cn.ts              # Class name utility
│   │   └── format.ts          # Data formatting
│   └── hooks/                 # Custom React hooks
│       ├── useMarketData.ts   # Market data fetching
│       └── useDebounce.ts     # Debounce hook
├── public/                     # Static assets
│   ├── fonts/                 # Font files
│   ├── images/                # Images and logos
│   └── favicon.ico            # Favicon
├── styles/                     # Global styles
│   └── globals.css            # Global CSS + Tailwind
├── .env.local                 # Environment variables (git-ignored)
├── .gitignore                 # Git ignore rules
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

---

## 🎨 Design System

### **Color Palette**

```css
/* Dark Theme */
--background: #0A0E1A;      /* Primary background */
--foreground: #E8EAED;      /* Primary text */
--card: #13182B;            /* Card background */
--primary: #6366F1;         /* Indigo - Brand color */
--secondary: #1E293B;       /* Dark slate */
--accent: #F59E0B;          /* Amber - Highlights */
--success: #10B981;         /* Green - Positive */
--danger: #EF4444;          /* Red - Negative */
--warning: #FBBF24;         /* Yellow - Caution */
--muted: #64748B;           /* Gray - Secondary text */
```

### **Typography**

- **Primary Font:** Geist Sans (Vercel's design system)
- **Monospace Font:** Geist Mono (code blocks)
- **Font Sizes:**
  - `text-xs` - 0.75rem (12px)
  - `text-sm` - 0.875rem (14px)
  - `text-base` - 1rem (16px)
  - `text-lg` - 1.125rem (18px)
  - `text-xl` - 1.25rem (20px)
  - `text-2xl` - 1.5rem (24px)
  - `text-3xl` - 1.875rem (30px)
  - `text-4xl` - 2.25rem (36px)

### **Spacing Scale**

Following Tailwind's default spacing scale (4px base unit):
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `12` = 3rem (48px)

---

## 📊 Key Features by Page

### 🏠 **Landing Page** (`/`)
- Hero section with animated gradient background
- Value proposition and key benefits
- Feature showcase with icons
- Call-to-action buttons
- Responsive navigation bar

### 📈 **Dashboard** (`/dashboard`)
- Real-time market statistics cards
- Interactive trend charts (Recharts)
- Market category filters
- Live market feed table with sorting
- Quick access to AI chat panel
- Mobile-optimized layout

### 🔍 **Market Details** (`/markets/[id]`)
- Comprehensive market information
- Historical price charts with zoom
- Technical indicator overlays
- AI-powered market analysis
- Order book visualization
- Related markets section

### 🤖 **AI Assistant** (`/assistant`)
- Full-screen chat interface
- Streaming AI responses (SSE)
- Suggested financial prompts
- Markdown message rendering
- Copy/regenerate message actions
- Export conversation history
- Persistent conversation (session storage)

### 📉 **Analytics** (`/analytics`)
- Market heatmaps
- Sector trend analysis
- Comparative analysis tools
- Technical indicator dashboard
- Performance metrics
- Data export functionality

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start Next.js dev server (port 3000)
npm run dev:backend  # Start Flask backend (port 5000)

# Production Build
npm run build        # Build optimized production bundle
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier

# Testing (if configured)
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## 🤝 Team & Contributors

### **Development Team**

<table>
  <tr>
    <td align="center">
      <strong>Shorya Raj</strong><br>
      <sub>Full Stack Developer</sub><br>
      <a href="https://github.com/X-XENDROME-X">GitHub</a>
    </td>
    <td align="center">
      <strong>Pranjal Shrivatava</strong><br>
      <sub>Full Stack Developer</sub><br>
      <a href="https://github.com/Lossul">GitHub</a>
    </td>
    <td align="center">
      <strong>Abhinav Ranish</strong><br>
      <sub>Backend Developer</sub><br>
      <a href="https://github.com/Abhinav-ranish">GitHub</a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Anshuman Yadav</strong><br>
      <sub>Full Stack Developer</sub><br>
      <a href="https://github.com/ayadav75">GitHub</a>
    </td>
    <td align="center">
      <strong>Emeka</strong><br>
      <sub>Developer</sub><br>
      <a href="https://github.com/Ekwenibe">GitHub</a>
    </td>
    <td></td>
  </tr>
</table>

---

## 🏆 Acknowledgments & Citations

### **APIs & Services**

- **[Anthropic](https://www.anthropic.com/)** - Claude AI API for intelligent financial analysis
  - License: [Anthropic Terms of Service](https://www.anthropic.com/legal/commercial-terms)
  - Model: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

- **[Finnhub](https://finnhub.io/)** - Real-time stock market data and quotes
  - License: [Finnhub API Terms](https://finnhub.io/terms)
  - Free tier: 60 API calls/minute

- **[Yahoo Finance](https://finance.yahoo.com/)** - Historical data and fundamental metrics
  - Access via [yfinance](https://github.com/ranaroussi/yfinance) Python library
  - License: Apache License 2.0

- **[Polymarket](https://polymarket.com/)** - Prediction market data
  - License: [Polymarket Terms](https://polymarket.com/terms)
  - Public API for market information

- **[Google Trends](https://trends.google.com/)** - Search trend sentiment analysis
  - Access via [pytrends](https://github.com/GeneralMills/pytrends) library
  - License: Apache License 2.0

### **Frameworks & Libraries**

- **[Next.js](https://nextjs.org/)** by Vercel - React framework (MIT License)
- **[React](https://react.dev/)** by Meta - UI library (MIT License)
- **[TypeScript](https://www.typescriptlang.org/)** by Microsoft - Type-safe JavaScript (Apache 2.0)
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework (MIT License)
- **[Flask](https://flask.palletsprojects.com/)** - Python web framework (BSD 3-Clause)
- **[pandas](https://pandas.pydata.org/)** - Data analysis library (BSD 3-Clause)
- **[ta](https://technical-analysis-library-in-python.readthedocs.io/)** - Technical analysis (MIT License)
- **[Recharts](https://recharts.org/)** - React charting library (MIT License)
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library (MIT License)
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components (MIT License)
- **[Lucide](https://lucide.dev/)** - Icon library (ISC License)

### **Infrastructure**

- **[Vercel](https://vercel.com/)** - Frontend hosting, CDN, and deployment
  - Geist font family (SIL Open Font License 1.1)
  
- **[Render](https://render.com/)** - Python backend hosting

- **[GitHub](https://github.com/)** - Version control and CI/CD

### **UI Components & Design**

- **[shadcn/ui](https://ui.shadcn.com/)** - Component collection built on Radix UI (MIT License)
- **[Geist Font](https://vercel.com/font)** by Vercel - Typography system (SIL OFL 1.1)

### **Hackathon**

- **ASU Claude Builder Club** - Hackathon organizers and community
- **Anthropic** - Claude AI platform and developer resources

### **Open Source Community**

Special thanks to the open-source community for making projects like this possible. All dependencies are properly licensed and attributed in `package.json` and `requirements.txt`.

---

## 📄 License

**MIT License**

Copyright (c) 2025 Velarith Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🌟 Star This Repository

If you find Velarith useful or impressive, please consider giving it a ⭐ on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/X-XENDROME-X/Velarith?style=social)](https://github.com/X-XENDROME-X/Velarith/stargazers)

---

<div align="center">
  <br>
  <strong>Built with ❤️ by Team Velarith</strong>
  <br>
  <sub>For ASU Claude Builder Club Hackathon 2025</sub>
  <br><br>
  <a href="#top">⬆️ Back to Top</a>
</div>

