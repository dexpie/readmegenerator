import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory cache for summaries (repoUrl -> { summary, expires })
const summaryCache = new Map<string, { summary: any; expires: number }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { repoUrl } = req.body;
    const apiKey = process.env.SHAPESAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'ShapesAI API key not configured' });
    }
    if (!repoUrl) {
        return res.status(400).json({ error: 'Missing repoUrl in request body' });
    }

    // Return cached value if still valid
    const cached = summaryCache.get(repoUrl);
    if (cached && cached.expires > Date.now()) {
        return res.status(200).json({ summary: cached.summary, cached: true });
    }

    // Build base URL from env var with fallback and normalize
    const base = (process.env.SHAPESAI_API_BASE || 'https://api.shapes.inc/v1').replace(/\/$/, '');
    const endpoint = `${base}/summary`;

    try {
        // Timeout using AbortController
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

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
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        // Cache for 5 minutes
        summaryCache.set(repoUrl, { summary: data, expires: Date.now() + 5 * 60 * 1000 });

        res.status(200).json({ summary: data });
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'ShapesAI request timed out' });
        }
        console.error('ShapesAI summary error:', err);
        res.status(500).json({ error: 'Failed to fetch summary from ShapesAI' });
    }
}
