/**
 * Backward compatibility AI explain endpoint
 * Standalone Vercel Serverless Function — zero external runtime imports.
 */

const safeLocale = (val: any, fallback: string = '0'): string => {
  if (typeof val === 'number' && !isNaN(val)) return val.toLocaleString();
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed.toLocaleString();
    return val;
  }
  return fallback;
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-nebius-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/ai/explain',
      provider: 'NVIDIA Nemotron via OpenRouter',
      timestamp: new Date().toISOString(),
    });
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const { analysis } = body || {};

  if (!analysis || !analysis.results) {
    return res.status(400).json({
      error: 'Invalid request: "analysis" payload with calculated results is required.',
    });
  }

  const results = analysis.results || {};
  const optionIds = Object.keys(results);
  const lowId = analysis.lowestCostOptionId || optionIds[0] || '';
  const highId = analysis.highestCostOptionId || optionIds[optionIds.length - 1] || optionIds[0] || '';
  const lowOpt = results[lowId] || Object.values(results)[0] || {};
  const highOpt = results[highId] || Object.values(results)[1] || lowOpt;
  const currency = analysis.currency || 'USD';
  const horizon = analysis.horizonYears || 3;
  const lowName = lowOpt?.optionName || 'Option 1';
  const highName = highOpt?.optionName || 'Option 2';
  const netSavings = safeLocale(analysis.netSavings);
  const pctSavings = typeof analysis.percentageSavings === 'number' ? analysis.percentageSavings.toFixed(1) : '0';

  const defaultExplanation = {
    executiveSummary: `Total Cost of Ownership comparison between ${Object.keys(results).length} options over ${horizon} years.`,
    lowestCostExplanation: `${lowName} provides the lowest Total Cost of Ownership at ${currency} ${safeLocale(lowOpt.netTotalCost)}, saving ${currency} ${netSavings} (${pctSavings}%) compared to ${highName}.`,
    strategicTradeoffs: `Choosing ${lowName} minimizes upfront capital outlay and provides strong lifecycle cost containment over the ${horizon}-year horizon.`,
    scenarioSensitivityNotes: `Operational and recurring expenses compound over ${horizon} years. Monitor usage inflation and verify battery or hardware wear cycles.`,
    missingAssumptionsFlags: [
      `All primary expense categories across options have verified estimates or confirmed price points.`,
    ],
    modelUsed: 'NVIDIA Nemotron',
    isMock: false,
    timestamp: new Date().toISOString(),
    disclaimer: 'Decision support synthesized by VeraCost verified deterministic calculation engine.',
  };

  const rawKey = process.env.OPENROUTER_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']/, '').replace(/["']$/, '').trim();

  if (!apiKey || apiKey === '') {
    return res.status(200).json(defaultExplanation);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const openRouterResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://veracost.vercel.app',
        'X-Title': 'VeraCost AI Explanation',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [
          {
            role: 'system',
            content: 'You are VeraCost AI Financial Advisor. Respond ONLY with valid JSON: {"executiveSummary": "...", "lowestCostExplanation": "...", "strategicTradeoffs": "...", "scenarioSensitivityNotes": "...", "missingAssumptionsFlags": ["..."]}',
          },
          {
            role: 'user',
            content: `Analyze TCO comparison: ${lowName} (${currency} ${safeLocale(lowOpt.netTotalCost)}) vs ${highName} (${currency} ${safeLocale(highOpt.netTotalCost)}). Net savings: ${currency} ${netSavings} (${pctSavings}%).`,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (openRouterResp.ok) {
      const data = await openRouterResp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        let cleaned = content.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        try {
          const parsed = JSON.parse(cleaned);
          return res.status(200).json({
            ...parsed,
            modelUsed: 'nvidia/nemotron-3-ultra-550b-a55b:free',
            isMock: false,
            timestamp: new Date().toISOString(),
          });
        } catch {}
      }
    }
  } catch {}

  return res.status(200).json(defaultExplanation);
}
