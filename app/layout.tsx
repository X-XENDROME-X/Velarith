import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import DynamicHeightManager from "@/components/layout/DynamicHeightManager";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://velarith.vercel.app'),
  title: "Velarith - AI-Powered Prediction Market Analytics",
  description: "Leverage Claude AI to analyze Polymarket data in real-time. Built for the ASU Claude Builder Club Hackathon 2025.",
  keywords: ["Polymarket", "Claude AI", "Prediction Markets", "Analytics", "AI"],
  authors: [{ name: "Team Velarith" }],
  icons: {
    icon: "/images/logo.jpg",
    shortcut: "/images/logo.jpg",
    apple: "/images/tlogo.png",
  },
  openGraph: {
    title: "Velarith - AI-Powered Prediction Market Analytics",
    description: "Leverage Claude AI to analyze Polymarket data in real-time",
    type: "website",
    images: [
      {
        url: "/images/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Velarith - Prediction Market Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velarith - AI-Powered Prediction Market Analytics",
    description: "Leverage Claude AI to analyze Polymarket data in real-time",
    images: ["/images/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <DynamicHeightManager />
        {children}
      </body>
    </html>
  );
}
