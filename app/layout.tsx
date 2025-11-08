import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velarith - AI-Powered Prediction Market Analytics",
  description: "Leverage Claude AI to analyze Polymarket data in real-time. Built for the ASU Claude Builder Club Hackathon 2025.",
  keywords: ["Polymarket", "Claude AI", "Prediction Markets", "Analytics", "AI"],
  authors: [{ name: "Team Velarith" }],
  openGraph: {
    title: "Velarith - AI-Powered Prediction Market Analytics",
    description: "Leverage Claude AI to analyze Polymarket data in real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
