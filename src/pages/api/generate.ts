import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGitHubRepoData } from '../../utils/repoFetcher';
import { generateReadme } from '../../utils/readmeGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const repoData = await fetchGitHubRepoData(url);
        const readme = generateReadme(repoData);
        res.status(200).json({ readme });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
