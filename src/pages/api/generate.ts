import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGitHubRepoData } from '../../utils/repoFetcher';
import { generateReadme } from '../../utils/readmeGenerator';
import { getShapesSummary } from '../../utils/shapesai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const repoData = await fetchGitHubRepoData(url);

    // Get AI summary via direct util (avoids internal HTTP and Vercel internal URL issues)
    let aiSummary: string | undefined;
    try {
      aiSummary = await getShapesSummary(url);
    } catch (err: any) {
      // Non-fatal: log and fall back to repo metadata
      console.warn('ShapesAI fetch failed:', err?.message || err);
    }

    const summaryToUse = aiSummary ?? repoData.meta?.description ?? '';

    // Ensure meta exists and inject description
    repoData.meta = { ...(repoData.meta || {}), description: summaryToUse };

    const readme = generateReadme(repoData);
    return res.status(200).json({ readme });
  } catch (err: any) {
    console.error('Generate API error:', err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: err?.message, stack: err?.stack });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
