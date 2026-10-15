import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { explainComparisonWithNemotron } from './nebiusClient';
import { ComparisonAnalysisResult } from '../src/types/cost';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'VeraCost Decision API',
    provider: 'NVIDIA Nemotron via Nebius Token Factory',
    timestamp: new Date().toISOString(),
  });
});

// Non-secret public configuration
app.get('/api/config', (req: Request, res: Response) => {
  const apiKey = process.env.NEBIUS_API_KEY;
  const isLive = Boolean(apiKey && apiKey.trim() !== '' && apiKey.trim() !== 'your_nebius_api_key_here');

  res.json({
    provider: 'Nebius Token Factory',
    defaultModel: process.env.NEBIUS_MODEL || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    baseUrl: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1',
    isLiveConfigured: isLive,
    mode: isLive ? 'live-nemotron' : 'mock-fallback',
  });
});

// AI Explanation Endpoint
app.post('/api/ai/explain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analysis, customApiKey, customModel } = req.body;

    if (!analysis || !analysis.results || !analysis.projectTitle) {
      return res.status(400).json({
        error: 'Invalid request: "analysis" payload with calculated results is required.',
      });
    }

    const customKeyHeader = req.headers['x-nebius-api-key'] as string | undefined;
    const effectiveKey = customApiKey || customKeyHeader;

    const explanation = await explainComparisonWithNemotron(analysis as ComparisonAnalysisResult, {
      apiKey: effectiveKey,
      model: customModel,
    });

    res.json(explanation);
  } catch (err: any) {
    next(err);
  }
});

// Test API Key verification endpoint
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  const testKey = req.body.apiKey || (req.headers['x-nebius-api-key'] as string);
  const baseUrl = (process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1').replace(/\/+$/, '');

  if (!testKey || testKey.trim() === '') {
    return res.status(400).json({ valid: false, message: 'API key is required.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${testKey.trim()}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      const models = data?.data?.map((m: any) => m.id) || [];
      return res.json({
        valid: true,
        message: 'Nebius Token Factory credentials successfully verified!',
        availableModels: models.filter((m: string) => m.includes('nemotron') || m.includes('nvidia') || m.includes('llama')),
      });
    } else {
      return res.status(resp.status).json({
        valid: false,
        message: `Nebius authentication failed with HTTP ${resp.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      valid: false,
      message: `Could not connect to Nebius Token Factory: ${err.message}`,
    });
  }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred during request processing.',
  });
});

app.listen(PORT, () => {
  console.log(`[VeraCost Server] Running on http://localhost:${PORT}`);
  console.log(`[VeraCost Server] Provider: Nebius Token Factory (NVIDIA Nemotron)`);
});
