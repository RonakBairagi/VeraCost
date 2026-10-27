export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawKey = process.env.OPENROUTER_API_KEY || '';
  const openRouterKey = rawKey.trim().replace(/^["']/, '').replace(/["']$/, '').trim();
  const isOpenRouterConfigured = Boolean(
    openRouterKey && openRouterKey !== '' && !openRouterKey.includes('your_openrouter_api_key')
  );

  const nebiusKey = process.env.NEBIUS_API_KEY?.trim() || '';
  const isNebiusConfigured = Boolean(
    nebiusKey && nebiusKey !== '' && !nebiusKey.includes('your_nebius_api_key')
  );

  const isLiveConfigured = isOpenRouterConfigured || isNebiusConfigured;
  const defaultModel = process.env.OPENROUTER_MODEL_ID || 'nvidia/nemotron-3.5-lightning:free';

  const googleVisionKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim() || '';
  const isGoogleVisionConfigured = Boolean(
    googleVisionKey && googleVisionKey !== '' && !googleVisionKey.includes('your_google_cloud_vision')
  );

  return res.status(200).json({
    provider: isOpenRouterConfigured ? 'OpenRouter (NVIDIA Nemotron)' : 'Nebius Token Factory',
    defaultModel,
    openRouterModel: defaultModel,
    isOpenRouterConfigured,
    isNebiusConfigured,
    isLiveConfigured,
    mode: isLiveConfigured ? 'live-nemotron' : 'deterministic-fallback',
    isGoogleVisionConfigured,
    timestamp: new Date().toISOString(),
  });
}
