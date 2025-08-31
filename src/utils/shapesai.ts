// Utility to fetch ShapesAI summary using the OpenAI-compatible chat/completions endpoint

type CacheEntry = { data: any; text?: string; expires: number };
const cache = new Map<string, CacheEntry>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getShapesSummary(repoUrl: string): Promise<string> {
  const apiKey = process.env.SHAPESAI_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const cached = cache.get(repoUrl);
  if (cached && cached.expires > Date.now()) {
    return String(cached.text ?? cached.data);
  }

  const base = (process.env.SHAPESAI_API_BASE || 'https://api.shapes.inc/v1').replace(/\/$/, '');
  const endpoint = `${base}/chat/completions`;
  const model = process.env.SHAPESAI_SHAPE || 'shapesinc/summarizer';

  const maxAttempts = 3;
  const baseDelay = 500; // ms
  const timeoutMs = Number(process.env.SHAPESAI_TIMEOUT_MS || '8000');

  const systemPrompt = 'You are an assistant that writes concise README project descriptions.';
  const userPrompt = `Summarize the GitHub repository at:\n\n${repoUrl}\n\nOutput a concise "Project Description" paragraph suitable for a README. Do not include extra commentary.`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err: any = new Error('REMOTE_ERROR');
        err.status = res.status;
        err.text = text;
        throw err;
      }

      const data = await res.json().catch(() => ({}));

      const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
      const summaryText = typeof content === 'string' ? content.trim() : JSON.stringify(content);

      // Prepend header "Deskripsi" if it's not already present
      const header = 'Deskripsi';
      const hasHeader = /^\s*Deskripsi\b/i.test(summaryText);
      const finalText = hasHeader ? summaryText : `${header}\n\n${summaryText}`;

      // Cache for 5 minutes
      cache.set(repoUrl, { data, text: finalText, expires: Date.now() + 5 * 60 * 1000 });

      return finalText;
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      const isLast = attempt === maxAttempts;
      console.warn(`[shapesai] attempt ${attempt} failed${isTimeout ? ' (timeout)' : ''}:`, err?.message || err);

      if (isLast) throw err;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw new Error('UNEXPECTED_ERROR');
}