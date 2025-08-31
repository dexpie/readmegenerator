// Utility to fetch ShapesAI summary with timeout, retries, backoff and in-memory cache

type CacheEntry = { data: any; text?: string; expires: number };
const cache = new Map<string, CacheEntry>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getShapesSummary(repoUrl: string): Promise<string | any> {
  const apiKey = process.env.SHAPESAI_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const cached = cache.get(repoUrl);
  if (cached && cached.expires > Date.now()) {
    return cached.text ?? cached.data;
  }

  const base = (process.env.SHAPESAI_API_BASE || 'https://api.shapes.inc/v1').replace(/\/$/, '');
  const endpoint = `${base}/summary`;

  const maxAttempts = 3;
  const baseDelay = 500; // ms
  const timeoutMs = 8000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: repoUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        const err: any = new Error('REMOTE_ERROR');
        err.status = response.status;
        err.text = text;
        throw err;
      }

      const data = await response.json();
      const summaryText = data?.summary?.summary || data?.summary?.text || data?.summary || (typeof data === 'string' ? data : undefined);

      // Cache parsed text (or raw data) for 5 minutes
      cache.set(repoUrl, { data, text: summaryText, expires: Date.now() + 5 * 60 * 1000 });

      return summaryText ?? data;
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      const isLast = attempt === maxAttempts;
      console.warn(`[shapesai] attempt ${attempt} failed${isTimeout ? ' (timeout)' : ''}:`, err?.message || err);

      if (isLast) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw new Error('UNEXPECTED_ERROR');
}
