export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'ok',
    service: 'VeraCost Decision API Gateway',
    provider: 'OpenRouter (NVIDIA Nemotron)',
    endpoints: [
      '/api/ai/decision-support',
      '/api/ai/explain',
      '/api/config',
      '/api/health'
    ],
    timestamp: new Date().toISOString(),
  });
}
