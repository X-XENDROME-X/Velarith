export interface StockQuote {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	logo?: string;
}

export interface StockSearchResult {
	symbol: string;
	name: string;
	type: string;
	exchange: string;
}

export interface TechnicalIndicators {
	rsi: number;
	macd: number;
	macdSignal: number;
	sma50: number;
	sma200: number;
	trendZone: string;
	crossover: string;
	squeezeZone: string;
	lastCandle: string;
	volumeSpike: string;
}

export interface FundamentalMetrics {
	pbRatio: number;
	trailingPE: number;
	forwardPE: number;
	marketCap: string;
	earningsGrowth: number;
	revenueGrowth: number;
}

export interface NewsSentiment {
	positive: number;
	neutral: number;
	negative: number;
}

export interface ScoreBreakdown {
	fundamentals: number;
	technical: number;
	news: number;
	insider: number;
	finalScore: number;
}

export interface AIAnalysis {
	recommendation: "BUY" | "SELL" | "HOLD";
	summary: string;
	strengths: string[];
	weaknesses: string[];
	fundamentalAnalysis: string;
	technicalAnalysis: string;
}

export interface AnalysisFilters {
	timeframe: string;
	pennyStock: boolean;
	age: string;
}
