# Velarith 🚀

**AI-Powered Prediction Market Analytics Platform**

> Built for the ASU Claude Builder Club Hackathon 2025 (Polymarket x Claude Track)

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)

---

## 🎯 Project Overview

**Velarith** is an innovative analytics platform that combines **Polymarket's prediction markets** with **Claude AI** to provide real-time insights, trend analysis, and intelligent market recommendations. Our mission is to make prediction markets accessible and understandable for everyone.

### 🏆 Hackathon Information
- **Event**: ASU Claude Builder Club Hackathon
- **Track**: Polymarket x Claude
- **Date**: November 8-9, 2025
- **Team Size**: 5 members
- **Prize**: $1,000 for 1st place

---

## ✨ Key Features

### 📊 Real-Time Market Analytics
- Live prediction market data from Polymarket
- Interactive charts and visualizations
- Category-based market filtering
- 24-hour volume tracking

### 🤖 AI-Powered Insights
- Claude AI integration for market analysis
- Natural language queries
- Sentiment analysis
- Risk assessment and predictions

### 📱 Responsive Design
- Mobile-first approach
- Touch-optimized interactions
- Smooth animations with Framer Motion
- Dark theme with modern aesthetics

### 🎨 Advanced Visualizations
- Interactive trend charts
- Market heatmaps
- Real-time order books
- Comparative analysis tools

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: Zustand
- **Data Fetching**: @tanstack/react-query
- **HTTP Client**: Axios

### APIs & Services
- **Polymarket API**: Prediction market data
- **Claude AI API**: Natural language processing and analysis
- **Deployment**: Vercel

---

## 👥 Team

| Name | 
|------|
| **Shorya Raj** | 
| **Pranjal Shrivastava** | 
| **Abhinav Ranish** |
| **Anshuman Yadav** | 
| **Emeka Ekwenibe** | 

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- Claude API key (from Anthropic)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/X-XENDROME-X/Velarith.git
   cd Velarith
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Polymarket API
   NEXT_PUBLIC_POLYMARKET_API_URL=https://api.polymarket.com/v1
   
   # Claude AI API
   ANTHROPIC_API_KEY=your_api_key_here
   NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022
   
   # App Config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Velarith/
├── app/                        # Next.js 14 App Router
│   ├── (landing)/             # Landing page
│   ├── dashboard/             # Main analytics dashboard
│   ├── markets/[id]/          # Individual market details
│   ├── assistant/             # AI chat interface
│   ├── analytics/             # Advanced analytics
│   └── api/                   # API routes
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Navigation, header, footer
│   ├── dashboard/             # Dashboard-specific components
│   ├── markets/               # Market detail components
│   ├── ai/                    # AI chat components
│   └── analytics/             # Analytics visualizations
├── lib/                        # Utilities and helpers
│   ├── api/                   # API clients
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Helper functions
│   └── hooks/                 # Custom React hooks
├── public/                     # Static assets
└── styles/                     # Global styles
```

---

## 🎨 Design System

### Color Palette
```css
--background: #0A0E1A;      /* Dark background */
--text: #E8EAED;            /* Light text */
--primary: #6366F1;         /* Indigo - Brand color */
--secondary: #1E293B;       /* Dark slate */
--accent: #F59E0B;          /* Amber - Highlights */
--success: #10B981;         /* Green */
--danger: #EF4444;          /* Red */
```

### Typography
- **Primary Font**: Inter / Geist Sans
- **Monospace**: Geist Mono

---

## 🌿 Git Workflow

### Branch Strategy
- `main` - Production branch (protected)
- `shorya` - Shorya's development branch
- `pranjal` - Pranjal's development branch
- `abhinav` - Abhinav's development branch
- `anshuman` - Anshuman's development branch
- `emeka` - Emeka's development branch

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new feature
fix: bug fix
style: code style changes
refactor: code refactoring
docs: documentation updates
test: add tests
```

### Workflow
1. Always work on your assigned branch
2. Sync with main regularly: `git pull origin main`
3. Create Pull Requests to merge to main
4. Never force push to main

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 🚢 Deployment

This project is configured for deployment on **Vercel**:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/X-XENDROME-X/Velarith)

---

## 📊 Key Pages

### 🏠 Landing Page (`/`)
- Hero section with value proposition
- Feature showcase
- Call-to-action

### 📈 Dashboard (`/dashboard`)
- Real-time market statistics
- Interactive trend charts
- Market category filters
- Live market feed table
- AI chat panel

### 🔍 Market Details (`/markets/[id]`)
- Detailed market information
- Historical price charts
- AI-powered analysis
- Order book visualization

### 🤖 AI Assistant (`/assistant`)
- Full-screen chat interface
- Suggested prompts
- Persistent conversation history

### 📉 Analytics (`/analytics`)
- Market heatmaps
- Trend analysis
- Comparative tools

---

## 🎯 Roadmap

- [x] Project setup and structure
- [x] Landing page
- [x] Dashboard layout
- [ ] Polymarket API integration
- [ ] Claude AI integration
- [ ] Market details page
- [ ] Analytics page
- [ ] Mobile optimization
- [ ] Demo video production

---

## 🤝 Contributing

This is a hackathon project with a tight deadline. Team members should:
1. Work on assigned branches
2. Communicate regularly
3. Follow the code style guide
4. Test thoroughly before merging

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **ASU Claude Builder Club** for organizing the hackathon
- **Polymarket** for providing the prediction market data API
- **Anthropic** for Claude AI capabilities
- **Vercel** for hosting and deployment

---

