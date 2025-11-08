import matplotlib.pyplot as plt
import base64
from io import BytesIO

def plot_technical_chart(df, ticker):
    """Generate base64 PNG with major indicators."""
    plt.figure(figsize=(12, 7))
    plt.title(f"{ticker} Technical Overview", fontsize=14)
    plt.plot(df.index, df["Close"], label="Close", color="white", linewidth=1.5)
    plt.plot(df.index, df["EMA20"], label="EMA 20", alpha=0.8)
    plt.plot(df.index, df["EMA50"], label="EMA 50", alpha=0.8)
    plt.plot(df.index, df["EMA200"], label="EMA 200", alpha=0.8)
    plt.fill_between(df.index, df["BB_H"], df["BB_L"], alpha=0.1, label="Bollinger Bands")

    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()

    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=150, facecolor="#111111")
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")
