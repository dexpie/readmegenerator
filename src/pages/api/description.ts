import type { NextApiRequest, NextApiResponse } from 'next';
import { getShapesSummary } from '../../utils/shapesai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = (req.method === 'GET' ? req.query.url : (req.body && req.body.url)) as string | undefined;
  if (!url) {
    res.status(400).json({ error: 'No URL provided' });
    return;
  }

  try {
    let description: string | undefined;
    try {
      description = await getShapesSummary(String(url));
    } catch (err: any) {
      console.warn('ShapesAI summary error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to generate description' });
    }

    res.status(200).json({ description: description ?? '' });
  } catch (err: any) {
    console.error('Description API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
