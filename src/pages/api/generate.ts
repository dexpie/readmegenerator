import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGitHubRepoData } from '../../utils/repoFetcher';
import { generateReadme } from '../../utils/readmeGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const repoData = await fetchGitHubRepoData(url);

        // Try to get an AI-generated summary if ShapesAI key is configured
        let aiSummary: string | undefined = undefined;
        const shapesKey = process.env.SHAPESAI_API_KEY;
        if (shapesKey) {
            try {
                const shapesRes = await fetch('https://api.shapes.inc/v1/summary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${shapesKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                });

                if (shapesRes.ok) {
                    const data = await shapesRes.json();
                    aiSummary = data?.summary || data?.text || (typeof data === 'string' ? data : undefined);
                }
            } catch (err) {
                console.warn('ShapesAI summary failed:', err);
            }
        }

        // Use AI summary if available, otherwise fallback to repo description
        const summaryToUse = aiSummary ?? repoData.meta.description ?? '';

        // Inject summary into repoData so generateReadme picks it up
        repoData.meta.description = summaryToUse;

        const readme = generateReadme(repoData);
        res.status(200).json({ readme });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
