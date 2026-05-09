// Server-only helper for the boot probe route handlers in app/api/boot/*.
// We proxy the three boot probes through Next.js so the browser only ever
// sees same-origin requests — extensions and DNS filters that target
// `*.onrender.com` can't reach into our own domain without breaking the
// whole site.

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:10000';

export async function proxyTo(
  path: string,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const upstream = await fetch(`${BACKEND_BASE_URL}${path}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });

    // Pass through body + status. Don't clone every header — just keep the
    // content-type so the client parses correctly. Force no-store so neither
    // Vercel's edge nor the browser caches a probe response.
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? 'upstream-timeout'
        : 'upstream-unreachable';
    return Response.json({ error: reason }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
