import { notFound } from "next/navigation";
import { fetchMarket, BackendError } from "@/lib/api/backend";
import { MarketHeader } from "@/components/markets/MarketHeader";
import { OddsHistoryChart } from "@/components/markets/OddsHistoryChart";
import { AITakeSection } from "@/components/markets/AITakeCard";
import { RelatedTickersPanel } from "@/components/markets/RelatedTickersPanel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30;

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let detail;
  try {
    detail = await fetchMarket(slug);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10 sm:space-y-8">
      <MarketHeader detail={detail} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <OddsHistoryChart slug={slug} />
          <AITakeSection slug={slug} />
        </div>
        <div className="space-y-5">
          <RelatedTickersPanel slug={slug} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const detail = await fetchMarket(slug);
    return {
      title: `${detail.question} · Velarith`,
      description: detail.description?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Market · Velarith" };
  }
}
