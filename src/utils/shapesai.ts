// Utility to fetch ShapesAI summary with timeout and in-memory cache

type CacheEntry = { data: any; text?: string; expires: number };
const cache = new Map<string, CacheEntry>();

export async function getShapesSummary(repoUrl: string): Promise<string | any> {
  const apiKey = process.env.SHAPESAI_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const cached = cache.get(repoUrl);
  if (cached && cached.expires > Date.now()) {
    return cached.text ?? cached.data;
  }

  const base = (process.env.SHAPESAI_API_BASE || 'https://api.shapes.inc/v1').replace(/\/$/, '');
  const endpoint = `${base}/summary`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
    if (err?.name === 'AbortError') {
      const e = new Error('TIMEOUT');
      throw e;
    }
    throw err;
  }
}
