import { explainComparisonWithNemotronOpenRouter } from '../../server/openrouterClient';
import { explainComparisonWithNemotron } from '../../server/nebiusClient';
import type { ComparisonAnalysisResult } from '../../src/types/cost';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-nebius-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { analysis, customApiKey, customModel } = body || {};

    if (!analysis || !analysis.results) {
      return res.status(400).json({
        error: 'Invalid request: "analysis" payload with calculated results is required.',
      });
    }

    const customKeyHeader = req.headers['x-nebius-api-key'] as string | undefined;
    const effectiveNebiusKey = customApiKey || customKeyHeader;

    if (effectiveNebiusKey) {
      const explanation = await explainComparisonWithNemotron(analysis as ComparisonAnalysisResult, {
        apiKey: effectiveNebiusKey,
        model: customModel,
      });
      return res.status(200).json(explanation);
    }

    const explanation = await explainComparisonWithNemotronOpenRouter(
      analysis as ComparisonAnalysisResult,
      customModel
    );

    return res.status(200).json(explanation);
  } catch (err: any) {
    console.error('[Vercel Serverless /api/ai/explain] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred during request processing.',
    });
  }
}
