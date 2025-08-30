import type { NextApiRequest, NextApiResponse } from 'next';
import { getShapesSummary } from '../../utils/shapesai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = (req.method === 'GET' ? req.query.url : (req.body && req.body.url)) as string | undefined;
  if (!url) {
    res.status(400).json({ error: 'No URL provided' });
    return;
  }

  try {
    let description = '';

    try {
      const result = await getShapesSummary(String(url));
      description = typeof result === 'string' ? result : JSON.stringify(result);
    } catch (err: any) {
      // Log the error but return a safe JSON response so the client never gets HTML errors
      console.warn('ShapesAI summary error:', err?.message || err);
      description = '';
    }

    const markdown = `# Project Description\n\n${description || 'No description available.'}\n\n`;
    res.status(200).json({ description: description ?? '', markdown });
  } catch (err: any) {
    console.error('Description API unexpected error:', err);
    res.status(200).json({ description: '', markdown: '# Project Description\n\nNo description available.\n\n', error: 'internal_error' });
  }
}
