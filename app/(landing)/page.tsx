export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-4xl">
        <h1 className="text-6xl font-bold gradient-text">
          Velarith
        </h1>
        <p className="text-2xl text-muted-foreground">
          AI-Powered Prediction Market Analytics
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Leverage Claude AI to analyze Polymarket data in real-time. 
          Built for the ASU Claude Builder Club Hackathon 2025.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/dashboard"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Explore Markets
          </a>
          <a
            href="/assistant"
            className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            AI Assistant
          </a>
        </div>
      </div>
    </main>
  );
}
