import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { explainComparisonWithNemotron } from './nebiusClient';
import { ComparisonAnalysisResult } from '../src/types/cost';
import { searchRouter } from './searchRoutes';
import { supportChatRouter } from './supportChat';
import { voiceRouter } from './voiceRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Vercel Serverless / Proxy Body Stream Safeguard:
// If an upstream proxy or Vercel's @vercel/node helper has already read the body stream
// into req.body, mark it as read so body-parser does not hang on the closed stream.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body !== undefined && req.body !== null) {
    (req as any)._body = true;
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // preserve original text if not JSON
      }
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Search & Retailer Routes:
// Mount on both '/api/search' and '/search' to handle both direct and rewritten Vercel requests
app.use('/api/search', searchRouter);
app.use('/search', searchRouter);

// Support & Vera Assistant Chatbot Routes:
app.use('/api/support', supportChatRouter);
app.use('/support', supportChatRouter);

// Voice AI & Speech Synthesis Routes:
app.use('/api/voice', voiceRouter);
app.use('/voice', voiceRouter);

// Health Check
const healthHandler = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'VeraCost Decision API',
    provider: 'NVIDIA Nemotron via Nebius Token Factory',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Non-secret public configuration
const configHandler = (req: Request, res: Response) => {
  const apiKey = process.env.NEBIUS_API_KEY;
  const isLive = Boolean(apiKey && apiKey.trim() !== '' && apiKey.trim() !== 'your_nebius_api_key_here');
  const googleVisionKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  const isGoogleVisionConfigured = Boolean(
    googleVisionKey && googleVisionKey.trim() !== '' && !googleVisionKey.includes('your_google_cloud_vision')
  );

  res.json({
    provider: 'Nebius Token Factory',
    defaultModel: process.env.NEBIUS_MODEL || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    baseUrl: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1',
    isLiveConfigured: isLive,
    mode: isLive ? 'live-nemotron' : 'mock-fallback',
    isGoogleVisionConfigured,
  });
};
app.get('/api/config', configHandler);
app.get('/config', configHandler);

// AI Explanation Endpoint
const explainHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analysis, customApiKey, customModel } = req.body || {};

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
};
app.post('/api/ai/explain', explainHandler);
app.post('/ai/explain', explainHandler);

// Test API Key verification endpoint
const testKeyHandler = async (req: Request, res: Response) => {
  const body = req.body || {};
  const testKey = body.apiKey || (req.headers['x-nebius-api-key'] as string);
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
};
app.post('/api/ai/test-key', testKeyHandler);
app.post('/ai/test-key', testKeyHandler);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred during request processing.',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[VeraCost Server] Running on http://localhost:${PORT}`);
    console.log(`[VeraCost Server] Provider: Nebius Token Factory (NVIDIA Nemotron)`);
  });
}

export default app;

