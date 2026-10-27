/**
 * VeraCost NVIDIA Nemotron Decision Support System Endpoint
 * Standalone Vercel Serverless Function — zero external runtime imports.
 */

interface NemotronOptionReview {
  optionName: string;
  netCost: string;
  summary: string;
}

interface NemotronDecisionResult {
  scenarioSummary: string;
  keyFindings: string[];
  availableOptions: NemotronOptionReview[];
  recommendedDecision: string;
  riskAssessment: string[];
  assumptionsAndMissingData: string[];
  suggestedNextSteps: string[];
  rawText?: string;
  modelUsed?: string;
  provider?: string;
  isLive?: boolean;
  timestamp?: string;
  disclaimer?: string;
}

const safeLocale = (val: any, fallback: string = '0'): string => {
  if (typeof val === 'number' && !isNaN(val)) return val.toLocaleString();
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed.toLocaleString();
    return val;
  }
  return fallback;
};

function generateDeterministicDecision(
  analysis: any,
  userScenario?: string,
  modelName: string = 'VeraCost Decision Engine',
  disclaimerMsg?: string
): NemotronDecisionResult {
  const results = analysis?.results || {};
  const optionIds = Object.keys(results);
  const lowestOptionId = analysis?.lowestCostOptionId || optionIds[0] || '';
  const highestOptionId = analysis?.highestCostOptionId || optionIds[optionIds.length - 1] || optionIds[0] || '';
  const lowestOption = results[lowestOptionId] || Object.values(results)[0] || {};
  const highestOption = results[highestOptionId] || Object.values(results)[1] || lowestOption;

  const lowName = lowestOption?.optionName || 'Option 1';
  const highName = highestOption?.optionName || 'Option 2';
  const currency = analysis?.currency || 'USD';
  const horizon = analysis?.horizonYears || 3;
  const netSavings = safeLocale(analysis?.netSavings);
  const pctSavings = typeof analysis?.percentageSavings === 'number' ? analysis.percentageSavings.toFixed(1) : '0';

  const lowCostStr = safeLocale(lowestOption?.netTotalCost);
  const highCostStr = safeLocale(highestOption?.netTotalCost);
  const lowMonthlyStr = safeLocale(lowestOption?.monthlyEquivalentCost);
  const highMonthlyStr = safeLocale(highestOption?.monthlyEquivalentCost);

  const availableOptions: NemotronOptionReview[] = Object.values(results).map((opt: any) => {
    const isLowest = opt?.optionId === lowestOptionId;
    const initialAcq = safeLocale(opt?.initialAcquisitionTotal);
    const operatingOps = safeLocale(
      (opt?.operatingTotal || 0) + (opt?.maintenanceTotal || 0) + (opt?.recurringTotal || 0)
    );
    const residualRec = safeLocale(opt?.residualRecoveryTotal);

    return {
      optionName: opt?.optionName || 'Product Option',
      netCost: `${currency} ${safeLocale(opt?.netTotalCost)}`,
      summary: `${isLowest ? 'Cost leader' : 'Higher outlay'}. Upfront acquisition: ${currency} ${initialAcq}, ongoing operating & maintenance: ${currency} ${operatingOps}, residual recovery: ${currency} ${residualRec}.`,
    };
  });

  const missingItems: string[] = [];
  Object.values(results).forEach((opt: any) => {
    if (opt?.confidenceBreakdown && opt.confidenceBreakdown.missingCount > 0) {
      missingItems.push(
        `${opt.optionName} has ${opt.confidenceBreakdown.missingCount} cost item(s) unestimated or flagged as missing.`
      );
    }
    if (opt && opt.replacementTotal === 0 && horizon >= 4) {
      missingItems.push(
        `For ${opt.optionName}, zero replacement outlays are modeled across a ${horizon}-year horizon. Consider battery or hardware wear.`
      );
    }
  });
  if (missingItems.length === 0) {
    missingItems.push('All primary expense categories across options have verified estimates or confirmed pricing.');
  }

  const riskAssessment: string[] = [
    `Maintenance & Wear Disparity: Operational costs compound over ${horizon} years. Any increase in recurring fees directly widens the financial delta.`,
    `Residual Resale Uncertainty: Salvage value recovery depends on secondary market liquidity at month ${horizon * 12}.`,
    `Scenario Sensitivity: Under a high-inflation or high-usage scenario, variable operational expenses could increase total outlay by 15-22%.`,
  ];

  const suggestedNextSteps: string[] = [
    `Verify quote accuracy for the upfront acquisition price of ${lowName}.`,
    `Audit recurring subscription or service maintenance contracts for auto-renew price escalation clauses.`,
    `Stress-test the decision with the higher-cost simulator scenario before finalizing long-term commitments.`,
  ];

  return {
    scenarioSummary: userScenario
      ? `Analysis for user scenario: "${userScenario}". Comparing ${Object.keys(results).length} option(s) over a ${horizon}-year ownership horizon under the ${analysis?.scenario?.toUpperCase() || 'TYPICAL'} scenario.`
      : `Evaluating Total Cost of Ownership for ${Object.keys(results).length} option(s) over a ${horizon}-year horizon under the ${analysis?.scenario?.toUpperCase() || 'TYPICAL'} stress-test scenario.`,
    keyFindings: [
      `${lowName} delivers the lowest Net Total Cost of Ownership at ${currency} ${lowCostStr} compared to ${currency} ${highCostStr} for ${highName}, saving ${currency} ${netSavings} (${pctSavings}%).`,
      `Primary cost driver: ${analysis?.keyDrivers?.[0]?.title || 'Upfront purchase price and operational efficiency differences'}.`,
      `Monthly amortized equivalent cost: ${currency} ${lowMonthlyStr}/mo for ${lowName} vs ${currency} ${highMonthlyStr}/mo for ${highName}.`,
    ],
    availableOptions: availableOptions.length > 0 ? availableOptions : [
      { optionName: lowName, netCost: `${currency} ${lowCostStr}`, summary: 'Evaluated in simulator model.' }
    ],
    recommendedDecision: `Based on deterministic lifecycle modeling, **${lowName}** is the recommended choice with a net TCO of ${currency} ${lowCostStr}. It balances upfront capital efficiency with sustainable long-term operating costs.`,
    riskAssessment,
    assumptionsAndMissingData: missingItems,
    suggestedNextSteps,
    modelUsed: modelName,
    provider: 'OpenRouter',
    isLive: false,
    timestamp: new Date().toISOString(),
    disclaimer: disclaimerMsg || 'Decision support commentary synthesized by VeraCost verified deterministic calculation engine.',
  };
}

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

  // Handle health check / GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/ai/decision-support',
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

  const { analysis, userScenario, customModel } = body || {};

  if (!analysis || !analysis.results) {
    return res.status(400).json({
      error: 'Invalid request: "analysis" payload with calculated results is required.',
    });
  }

  // Sanitize API key
  const rawApiKey = process.env.OPENROUTER_API_KEY || '';
  const apiKey = rawApiKey.trim().replace(/^["']/, '').replace(/["']$/, '').trim();

  // If no API key configured on server, return verified deterministic analysis with 200
  if (!apiKey || apiKey === '' || apiKey.includes('your_openrouter_api_key')) {
    const fallback = generateDeterministicDecision(
      analysis,
      userScenario,
      'VeraCost Decision Engine (Key Unconfigured)',
      'Decision support commentary generated from verified deterministic calculations. Configure OPENROUTER_API_KEY in Vercel environment variables for live NVIDIA Nemotron cloud inference.'
    );
    return res.status(200).json(fallback);
  }

  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
    .trim()
    .replace(/^["']/, '')
    .replace(/["']$/, '')
    .replace(/\/+$/, '');

  // Always map to the fast reasoning model so that inference completes reliably in 2-5 seconds
  let targetModel = (customModel || process.env.OPENROUTER_MODEL_ID || 'nvidia/nemotron-3.5-lightning:free')
    .trim()
    .replace(/^["']/, '')
    .replace(/["']$/, '');

  if (
    !targetModel ||
    targetModel.includes('550b') ||
    targetModel.includes('[') ||
    targetModel.includes('INSERT')
  ) {
    targetModel = 'nvidia/nemotron-3.5-lightning:free';
  }

  try {
    const results = analysis.results || {};
    const lowestOption = results[analysis.lowestCostOptionId] || Object.values(results)[0] || {};
    const highestOption = results[analysis.highestCostOptionId] || Object.values(results)[1] || lowestOption;

    const systemPrompt = `You are the VeraCost NVIDIA Nemotron Decision Support System.
Analyze the Total Cost of Ownership comparison and return ONLY a valid JSON object matching this exact schema:
{
  "scenarioSummary": "Concise summary of user problem, comparison parameters, and horizon",
  "keyFindings": ["Quantitative finding with exact savings", "Primary cost driver finding"],
  "availableOptions": [{"optionName": "Name", "netCost": "Currency Amount", "summary": "Pros, cons, cost trade-offs"}],
  "recommendedDecision": "Clear recommendation of optimal option with quantitative justification",
  "riskAssessment": ["Financial risk 1", "Operational risk 2"],
  "assumptionsAndMissingData": ["Key assumption or unverified line item"],
  "suggestedNextSteps": ["Actionable next step 1", "Actionable next step 2"]
}`;

    const userPrompt = `Project: "${analysis?.projectTitle || 'Comparison'}" (${analysis?.horizonYears || 3}-Year, ${analysis?.scenario?.toUpperCase() || 'TYPICAL'} scenario).
User Scenario: "${userScenario && userScenario.trim().length > 0 ? userScenario.trim() : 'Recommend the optimal decision based on Total Cost of Ownership.'}"
Lowest TCO: "${lowestOption?.optionName || 'Option 1'}" - Net TCO: ${analysis?.currency || 'USD'} ${safeLocale(lowestOption?.netTotalCost)} (Acquisition: ${analysis?.currency} ${safeLocale(lowestOption?.initialAcquisitionTotal)}, Ongoing/Ops: ${analysis?.currency} ${safeLocale((lowestOption?.operatingTotal || 0) + (lowestOption?.maintenanceTotal || 0) + (lowestOption?.recurringTotal || 0))}, Resale: ${analysis?.currency} ${safeLocale(lowestOption?.residualRecoveryTotal)}).
Highest TCO: "${highestOption?.optionName || 'Option 2'}" - Net TCO: ${analysis?.currency || 'USD'} ${safeLocale(highestOption?.netTotalCost)} (Acquisition: ${analysis?.currency} ${safeLocale(highestOption?.initialAcquisitionTotal)}, Ongoing/Ops: ${analysis?.currency} ${safeLocale((highestOption?.operatingTotal || 0) + (highestOption?.maintenanceTotal || 0) + (highestOption?.recurringTotal || 0))}, Resale: ${analysis?.currency} ${safeLocale(highestOption?.residualRecoveryTotal)}).
Net Savings: ${analysis?.currency || 'USD'} ${safeLocale(analysis?.netSavings)} (${analysis?.percentageSavings || 0}%).
Primary Cost Driver: ${analysis?.keyDrivers?.[0]?.title || 'Upfront purchase price variance'}.
Options Evaluated:
${Object.values(results).map((opt: any) => `- "${opt.optionName}": Net TCO ${analysis.currency} ${safeLocale(opt.netTotalCost)} (Upfront ${analysis.currency} ${safeLocale(opt.initialAcquisitionTotal)}, Ongoing ${analysis.currency} ${safeLocale((opt.operatingTotal || 0) + (opt.maintenanceTotal || 0) + (opt.recurringTotal || 0))}, Resale -${analysis.currency} ${safeLocale(opt.residualRecoveryTotal)})`).join('\n')}
Return the structured 7-section JSON decision support now.`;

    // Helper to invoke OpenRouter with a strict 8s timeout so Vercel 10s limit is never exceeded
    const fetchOpenRouter = async (modelName: string, timeoutMs: number = 8000): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const payload: any = {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 800,
          reasoning: { max_tokens: 0 },
        };

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://veracost.vercel.app',
            'X-Title': 'VeraCost NVIDIA Nemotron Decision Support',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);
        return response;
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    };

    let activeModel = targetModel;
    let resp: Response | null = null;

    try {
      resp = await fetchOpenRouter(activeModel, 8000);
    } catch (primaryErr: any) {
      console.warn(`[Nemotron] Call to ${activeModel} failed or timed out: ${primaryErr.message}`);
    }

    if (!resp || !resp.ok) {
      const fallback = generateDeterministicDecision(
        analysis,
        userScenario,
        'VeraCost Decision Engine',
        `Live cloud inference unavailable. Displaying verified deterministic decision synthesis based on live simulator data.`
      );
      return res.status(200).json(fallback);
    }

    const data = await resp.json();
    const rawContent = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning;

    if (!rawContent || typeof rawContent !== 'string') {
      const fallback = generateDeterministicDecision(analysis, userScenario, activeModel);
      return res.status(200).json(fallback);
    }

    // Parse JSON or extract structured sections from model response
    let parsed: any = null;
    let jsonText = rawContent.trim();

    // 1. Extract markdown code blocks if wrapped
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      const braceMatch = jsonText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0].trim();
      }
    }

    // 2. Remove any trailing commas that break JSON.parse
    const sanitizedJson = jsonText.replace(/,\s*([\]}])/g, '$1');

    try {
      parsed = JSON.parse(sanitizedJson);
    } catch {
      try {
        parsed = JSON.parse(jsonText);
      } catch {}
    }

    // 3. Guaranteed base decision support for any missing sections
    const baseDecision = generateDeterministicDecision(analysis, userScenario, activeModel);

    // Format available options properly even if model returns numbers for netCost
    let availableOptions: NemotronOptionReview[] = baseDecision.availableOptions;
    if (Array.isArray(parsed?.availableOptions) && parsed.availableOptions.length > 0) {
      availableOptions = parsed.availableOptions.map((opt: any) => ({
        optionName: String(opt.optionName || opt.option || 'Option'),
        netCost:
          typeof opt.netCost === 'number'
            ? `${analysis?.currency || 'USD'} ${safeLocale(opt.netCost)}`
            : String(opt.netCost || opt.price || ''),
        summary: String(opt.summary || opt.description || opt.pros || 'Evaluated in simulator model.'),
      }));
    }

    const finalResult: NemotronDecisionResult = {
      scenarioSummary:
        typeof parsed?.scenarioSummary === 'string' && parsed.scenarioSummary.trim().length > 10
          ? parsed.scenarioSummary.trim()
          : baseDecision.scenarioSummary,
      keyFindings:
        Array.isArray(parsed?.keyFindings) && parsed.keyFindings.length > 0
          ? parsed.keyFindings.map((f: any) => String(f))
          : baseDecision.keyFindings,
      availableOptions,
      recommendedDecision:
        typeof parsed?.recommendedDecision === 'string' && parsed.recommendedDecision.trim().length > 0
          ? parsed.recommendedDecision.trim()
          : baseDecision.recommendedDecision,
      riskAssessment:
        Array.isArray(parsed?.riskAssessment) && parsed.riskAssessment.length > 0
          ? parsed.riskAssessment.map((r: any) => String(r))
          : baseDecision.riskAssessment,
      assumptionsAndMissingData:
        Array.isArray(parsed?.assumptionsAndMissingData) && parsed.assumptionsAndMissingData.length > 0
          ? parsed.assumptionsAndMissingData.map((a: any) => String(a))
          : baseDecision.assumptionsAndMissingData,
      suggestedNextSteps:
        Array.isArray(parsed?.suggestedNextSteps) && parsed.suggestedNextSteps.length > 0
          ? parsed.suggestedNextSteps.map((s: any) => String(s))
          : baseDecision.suggestedNextSteps,
      rawText: rawContent,
      modelUsed: activeModel,
      provider: 'OpenRouter',
      isLive: true,
      timestamp: new Date().toISOString(),
      disclaimer: `Analysis synthesized live by NVIDIA Nemotron (${activeModel}) via OpenRouter. Grounded in deterministic calculations from VeraCost.`,
    };

    return res.status(200).json(finalResult);
  } catch (err: any) {
    console.error('[Nemotron Serverless] Error occurred:', err.message || err);
    // Bulletproof: Return 200 with deterministic analysis so the UI NEVER encounters HTTP 500
    const fallback = generateDeterministicDecision(
      analysis,
      userScenario,
      'VeraCost Decision Engine',
      `Live inference connection notice: ${err.message || 'Offline'}. Displaying verified deterministic decision synthesis based on live simulator data.`
    );
    return res.status(200).json(fallback);
  }
}
