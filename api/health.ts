export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const model = process.env.OPENROUTER_MODEL_ID || 'nvidia/nemotron-3-ultra-550b-a55b:free';

  return res.status(200).json({
    status: 'ok',
    service: 'VeraCost Decision API',
    provider: 'NVIDIA Nemotron Decision Support System via OpenRouter',
    model,
    timestamp: new Date().toISOString(),
  });
}
