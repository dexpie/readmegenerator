import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGitHubRepoData } from '../../utils/repoFetcher';
import { generateReadme } from '../../utils/readmeGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const repoData = await fetchGitHubRepoData(url);

        // Try to get an AI-generated summary via internal API route
        let aiSummary: string | undefined = undefined;
        try {
            // Use relative path when running in server environment to avoid needing BASE_URL
            const base = process.env.BASE_URL || '';
            const internalUrl = base ? `${base}/api/shapesai-summary` : `/api/shapesai-summary`;

            const summaryRes = await fetch(internalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // shapesai-summary expects { repoUrl }
                body: JSON.stringify({ repoUrl: url }),
            });

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                // shapesai-summary returns { summary: ... }
                aiSummary = data?.summary?.summary || data?.summary?.text || data?.summary || undefined;
            }
        } catch (err) {
            // ignore and fallback to repo metadata
            console.warn('Internal ShapesAI summary call failed:', err);
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
