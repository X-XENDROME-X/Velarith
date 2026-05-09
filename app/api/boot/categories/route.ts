import { proxyTo } from '@/lib/boot-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  return proxyTo('/polymarket/categories', 4000);
}
