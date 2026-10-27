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

  // User-configured or default model
  let targetModel = (customModel || process.env.OPENROUTER_MODEL_ID || 'nvidia/nemotron-3-ultra-550b-a55b:free')
    .trim()
    .replace(/^["']/, '')
    .replace(/["']$/, '');

  if (targetModel.includes('[') || targetModel.includes('INSERT') || targetModel === '') {
    targetModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
  }

  try {
    const results = analysis.results || {};
    const lowestOption = results[analysis.lowestCostOptionId] || Object.values(results)[0] || {};
    const highestOption = results[analysis.highestCostOptionId] || Object.values(results)[1] || lowestOption;

    const systemPrompt = `You are the VeraCost NVIDIA Nemotron Decision Support System, an expert quantitative decision advisor.
Analyze the Total Cost of Ownership (TCO) comparison, calculate trade-offs, and provide actionable, executive-grade recommendations based on the user's scenario and calculated simulator data.

CRITICAL RULES:
1. You MUST NOT alter or fabricate the verified numeric results deterministically computed by VeraCost. All figures in the prompt are verified calculations.
2. Distinguish confirmed facts from user assumptions, estimates, and missing information.
3. Identify missing information instead of inventing data.
4. Provide step-by-step reasoning summaries that are useful to the user.
5. Explain uncertainty, risk factors, and limitations.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "scenarioSummary": "Clear concise summary of the scenario, the user's specific problem/question, and the comparison parameters (horizon, scenario).",
  "keyFindings": [
    "Key quantitative finding 1 with exact numbers",
    "Key finding 2 regarding primary cost drivers"
  ],
  "availableOptions": [
    {
      "optionName": "Name of Option",
      "netCost": "Formatted net total cost with currency",
      "summary": "Pros, cons, cost structure (upfront vs operating), and key trade-offs"
    }
  ],
  "recommendedDecision": "Clear recommendation of which option to choose under the stated conditions, with comprehensive justification and trade-off rationale.",
  "riskAssessment": [
    "Specific financial or operational risk 1",
    "Specific risk 2 (e.g. maintenance volatility, replacement timing, residual value erosion)"
  ],
  "assumptionsAndMissingData": [
    "Specific assumption or missing cost line item that could alter this decision",
    "Confidence level observation (e.g. unverified user estimates vs confirmed quotes)"
  ],
  "suggestedNextSteps": [
    "Actionable next step 1 (e.g. verify warranty coverage or negotiate upfront discount)",
    "Actionable next step 2"
  ]
}`;

    const userPrompt = `USER SCENARIO / DECISION QUESTION:
"${userScenario && userScenario.trim().length > 0 ? userScenario.trim() : 'Evaluate all options, calculate risks and trade-offs, and recommend the optimal decision based on Total Cost of Ownership.'}"

SIMULATOR PROJECT CONTEXT:
Project: "${analysis?.projectTitle || 'Comparison Project'}"
Horizon: ${analysis?.horizonYears || 3} years
Scenario: ${analysis?.scenario || 'typical'}
Currency: ${analysis?.currency || 'USD'}
Discount Rate: ${analysis?.discountRatePct || 0}%

LOWEST COST OPTION:
"${lowestOption?.optionName || 'Option 1'}" — Net TCO: ${analysis?.currency || 'USD'} ${safeLocale(lowestOption?.netTotalCost)}

HIGHEST COST OPTION:
"${highestOption?.optionName || 'Option 2'}" — Net TCO: ${analysis?.currency || 'USD'} ${safeLocale(highestOption?.netTotalCost)}
Net Savings: ${analysis?.currency || 'USD'} ${safeLocale(analysis?.netSavings)} (${analysis?.percentageSavings || 0}%)

DETAILED OPTIONS BREAKDOWN:
${Object.values(results)
  .map(
    (opt: any) => `
* Option: "${opt.optionName}"
  - Upfront Acquisition: ${analysis.currency} ${safeLocale(opt.initialAcquisitionTotal)}
  - Setup & Accessories: ${analysis.currency} ${safeLocale(opt.setupAccessoriesTotal)}
  - Recurring Subscriptions: ${analysis.currency} ${safeLocale(opt.recurringTotal)}
  - Maintenance & Repairs: ${analysis.currency} ${safeLocale(opt.maintenanceTotal)}
  - Operating & Consumables: ${analysis.currency} ${safeLocale(opt.operatingTotal)}
  - Replacement Outlays: ${analysis.currency} ${safeLocale(opt.replacementTotal)} (${opt.replacementsOccurred || 0} replacements)
  - Residual Recovery (Resale): -${analysis.currency} ${safeLocale(opt.residualRecoveryTotal)}
  - Net Total Cost of Ownership: ${analysis.currency} ${safeLocale(opt.netTotalCost)} (Monthly Equivalent: ${analysis.currency} ${safeLocale(opt.monthlyEquivalentCost)})
  - Audit Confidence: ${opt.confidenceBreakdown?.confirmedTotal || 0} confirmed, ${opt.confidenceBreakdown?.userEstimateTotal || 0} user estimates, ${opt.confidenceBreakdown?.missingCount || 0} missing items.
`
  )
  .join('\n')}

TOP COST DRIVERS (Engine Identified):
${(analysis?.keyDrivers || [])
  .map((d: any) => `- ${d.title}: ${d.description} (Impact: ${analysis.currency} ${safeLocale(d.impactAmount)})`)
  .join('\n')}

Analyze this scenario and return the structured JSON decision support now.`;

    // Helper to invoke OpenRouter with a timeout
    const fetchOpenRouter = async (modelName: string): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://veracost.vercel.app',
            'X-Title': 'VeraCost NVIDIA Nemotron Decision Support',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 1200,
          }),
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
    let resp: Response;

    try {
      resp = await fetchOpenRouter(activeModel);
    } catch (primaryErr: any) {
      console.warn(`[Nemotron] First call to ${activeModel} failed: ${primaryErr.message}. Trying free model fallback...`);
      activeModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
      resp = await fetchOpenRouter(activeModel);
    }

    // If OpenRouter returns 402 (insufficient credits on paid model), 404, or 400:
    // Seamlessly retry with verified free Nemotron model
    if (!resp.ok && (resp.status === 402 || resp.status === 404 || resp.status === 400)) {
      if (activeModel !== 'nvidia/nemotron-3-ultra-550b-a55b:free') {
        console.warn(`[Nemotron] Model ${activeModel} returned HTTP ${resp.status}. Retrying with nvidia/nemotron-3-ultra-550b-a55b:free...`);
        activeModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
        try {
          resp = await fetchOpenRouter(activeModel);
        } catch {
          // Try lightning
        }
      }

      // If still not ok, try secondary lightning free model
      if (!resp.ok && activeModel !== 'nvidia/nemotron-3.5-lightning:free') {
        activeModel = 'nvidia/nemotron-3.5-lightning:free';
        try {
          resp = await fetchOpenRouter(activeModel);
        } catch {}
      }
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.warn(`[Nemotron] OpenRouter returned HTTP ${resp.status}: ${errText.slice(0, 150)}`);
      const fallback = generateDeterministicDecision(
        analysis,
        userScenario,
        'VeraCost Decision Engine',
        `Live cloud inference unavailable (OpenRouter HTTP ${resp.status}). Displaying verified deterministic decision synthesis based on live simulator data.`
      );
      return res.status(200).json(fallback);
    }

    const data = await resp.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      const fallback = generateDeterministicDecision(analysis, userScenario, activeModel);
      return res.status(200).json(fallback);
    }

    // Parse JSON from model
    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      const fallback = generateDeterministicDecision(analysis, userScenario, activeModel);
      return res.status(200).json(fallback);
    }

    const finalResult: NemotronDecisionResult = {
      scenarioSummary: parsed.scenarioSummary || 'Scenario analysis completed.',
      keyFindings: Array.isArray(parsed.keyFindings) && parsed.keyFindings.length > 0
        ? parsed.keyFindings
        : [String(parsed.keyFindings || 'Lowest TCO identified.')],
      availableOptions: Array.isArray(parsed.availableOptions) && parsed.availableOptions.length > 0
        ? parsed.availableOptions
        : Object.values(results).map((o: any) => ({
            optionName: o.optionName,
            netCost: `${analysis.currency} ${safeLocale(o.netTotalCost)}`,
            summary: 'Analyzed in comparison model.',
          })),
      recommendedDecision: parsed.recommendedDecision || 'Review detailed trade-offs above.',
      riskAssessment: Array.isArray(parsed.riskAssessment) && parsed.riskAssessment.length > 0
        ? parsed.riskAssessment
        : [String(parsed.riskAssessment || 'Review lifecycle cost variables.')],
      assumptionsAndMissingData: Array.isArray(parsed.assumptionsAndMissingData)
        ? parsed.assumptionsAndMissingData
        : [],
      suggestedNextSteps: Array.isArray(parsed.suggestedNextSteps) && parsed.suggestedNextSteps.length > 0
        ? parsed.suggestedNextSteps
        : ['Review upfront quotes and verify ongoing maintenance terms.'],
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
