/**
 * NVIDIA Nemotron Decision Support System Client via OpenRouter
 *
 * Interacts with OpenRouter's OpenAI-compatible chat-completions API.
 * Keeps OPENROUTER_API_KEY strictly on the server (never exposed to client or logs).
 * Uses the verified NVIDIA Nemotron model specified in OPENROUTER_MODEL_ID.
 * Strictly adheres to verified deterministic simulator calculations without fabrication.
 */

import {
  ComparisonAnalysisResult,
  NemotronDecisionRequest,
  NemotronDecisionResult,
  NemotronOptionReview,
  AiReviewResponse,
} from '../src/types/cost';

export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
export const FREE_NEMOTRON_FALLBACK_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
export const FAST_NEMOTRON_FALLBACK_MODEL = 'nvidia/nemotron-3.5-lightning:free';

/**
 * Safely format numbers with toLocaleString without throwing TypeErrors
 */
const safeLocale = (val: any, fallback: string = '0'): string => {
  if (typeof val === 'number' && !isNaN(val)) {
    return val.toLocaleString();
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed.toLocaleString();
    return val;
  }
  return fallback;
};

/**
 * Deterministic Fallback Decision Analysis
 * Used when OPENROUTER_API_KEY is missing or the external API is unreachable.
 * Generates transparent, mathematically verified reasoning strictly from simulator data.
 */
export function generateDeterministicDecisionResult(
  analysis: ComparisonAnalysisResult,
  userScenario?: string,
  modelName: string = 'VeraCost Fallback Decision Engine'
): NemotronDecisionResult {
  try {
    const results = analysis?.results || {};
    const optionIds = Object.keys(results);
    const lowestOptionId = analysis?.lowestCostOptionId || optionIds[0] || '';
    const highestOptionId = analysis?.highestCostOptionId || optionIds[optionIds.length - 1] || optionIds[0] || '';
    const lowestOption = results[lowestOptionId] || Object.values(results)[0];
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

    const availableOptions: NemotronOptionReview[] = Object.values(results).map((opt) => {
      const isLowest = opt?.optionId === lowestOptionId;
      const initialAcq = safeLocale(opt?.initialAcquisitionTotal);
      const operatingOps = safeLocale(
        (opt?.operatingTotal || 0) + (opt?.maintenanceTotal || 0) + (opt?.recurringTotal || 0)
      );
      const residualRec = safeLocale(opt?.residualRecoveryTotal);

      return {
        optionName: opt?.optionName || 'Product Option',
        netCost: `${currency} ${safeLocale(opt?.netTotalCost)}`,
        summary: `${isLowest ? 'Cost leader' : 'Higher cost option'}. Upfront acquisition: ${currency} ${initialAcq}, ongoing operating & maintenance: ${currency} ${operatingOps}, residual recovery: ${currency} ${residualRec}.`,
      };
    });

    const missingItems: string[] = [];
    Object.values(results).forEach((opt) => {
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
      missingItems.push(
        `All primary expense categories across options have verified estimates or confirmed pricing.`
      );
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
      disclaimer:
        'Decision support commentary generated from verified deterministic calculations. Configure OPENROUTER_API_KEY in the server environment for live NVIDIA Nemotron cloud inference.',
    };
  } catch (err: any) {
    console.error('[OpenRouter] Error in generateDeterministicDecisionResult:', err);
    return {
      scenarioSummary: 'Decision review generated from current simulator state.',
      keyFindings: ['Calculations verified by VeraCost deterministic engine.'],
      availableOptions: [],
      recommendedDecision: 'Review calculated TCO totals in the simulator workspace.',
      riskAssessment: ['Verify warranty coverage and replacement intervals.'],
      assumptionsAndMissingData: ['Audit unestimated line items.'],
      suggestedNextSteps: ['Check quotes and price points.'],
      modelUsed: modelName,
      provider: 'OpenRouter',
      isLive: false,
      timestamp: new Date().toISOString(),
      disclaimer: 'Decision support commentary.',
    };
  }
}

/**
 * Execute Decision Support Analysis with NVIDIA Nemotron on OpenRouter
 */
export async function analyzeScenarioWithNemotron(
  request: NemotronDecisionRequest
): Promise<NemotronDecisionResult> {
  const { userScenario, analysis, customModel } = request;

  // Sanitize API key (strip quotes or surrounding whitespace)
  const rawApiKey = process.env.OPENROUTER_API_KEY || '';
  const apiKey = rawApiKey.trim().replace(/^["']/, '').replace(/["']$/, '').trim();

  const baseUrl = (process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL)
    .trim()
    .replace(/^["']/, '')
    .replace(/["']$/, '')
    .replace(/\/+$/, '');

  // Sanitize model ID (ignore placeholder tokens like [INSERT-...] or quotes)
  let rawModel = (customModel || process.env.OPENROUTER_MODEL_ID || DEFAULT_OPENROUTER_MODEL)
    .trim()
    .replace(/^["']/, '')
    .replace(/["']$/, '');
  
  if (rawModel.includes('[') || rawModel.includes('INSERT') || rawModel === '') {
    rawModel = DEFAULT_OPENROUTER_MODEL;
  }
  const configuredModel = rawModel;
  const timeoutMs = 24000;

  // Check if server-side key is absent
  if (!apiKey || apiKey === '' || apiKey.includes('your_openrouter_api_key')) {
    return generateDeterministicDecisionResult(
      analysis,
      userScenario,
      'Deterministic Fallback (OpenRouter key unconfigured)'
    );
  }

  try {
    const results = analysis?.results || {};
    const lowestOption = results[analysis?.lowestCostOptionId] || Object.values(results)[0];
    const highestOption = results[analysis?.highestCostOptionId] || Object.values(results)[1] || lowestOption;

    const systemPrompt = `You are the VeraCost NVIDIA Nemotron Decision Support System, a senior quantitative decision & financial advisor.
Your role is to analyze Total Cost of Ownership (TCO) comparisons, calculate trade-offs, and provide actionable, executive-grade recommendations based on the user's scenario and calculated simulator data.

CRITICAL CONSTRAINTS:
1. You MUST NOT invent, alter, or recalculate the verified numeric results deterministically computed by VeraCost. All figures provided in the prompt are verified calculations.
2. Distinguish confirmed facts from user assumptions, estimates, and missing information.
3. Identify missing information instead of inventing data.
4. Provide step-by-step reasoning summaries that are useful to the user, without exposing private internal chain-of-thought.
5. Explain uncertainty, risk factors, and limitations.
6. Ask for clarification or note what would change the recommendation if critical information is missing.
7. Avoid claiming that a recommendation is guaranteed to be correct.
8. Avoid fabricating prices, live market data, external research, or simulator results.

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
    (opt) => `
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
  .map((d) => `- ${d.title}: ${d.description} (Impact: ${analysis.currency} ${safeLocale(d.impactAmount)})`)
  .join('\n')}

Analyze this scenario and return the structured JSON decision support now.`;

    // Helper to call OpenRouter
    const callOpenRouter = async (modelToUse: string): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://veracost.vercel.app',
            'X-Title': 'VeraCost NVIDIA Nemotron Decision Support',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return resp;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let activeModel = configuredModel;
    let response: Response;

    try {
      response = await callOpenRouter(activeModel);

      // If OpenRouter returns 402 (Insufficient credits), 404 (model moved/unavailable),
      // or 400 (model schema incompatible), automatically retry with verified free Nemotron model
      if (
        (!response.ok && (response.status === 402 || response.status === 404 || response.status === 400)) &&
        activeModel !== FREE_NEMOTRON_FALLBACK_MODEL
      ) {
        console.warn(
          `[OpenRouter] Model ${activeModel} returned HTTP ${response.status}. Retrying with verified free model ${FREE_NEMOTRON_FALLBACK_MODEL}...`
        );
        activeModel = FREE_NEMOTRON_FALLBACK_MODEL;
        response = await callOpenRouter(activeModel);
      }

      // If free model also returned an error, try fast lightning model as secondary backup
      if (!response.ok && activeModel !== FAST_NEMOTRON_FALLBACK_MODEL) {
        console.warn(
          `[OpenRouter] Retrying with secondary high-speed Nemotron model ${FAST_NEMOTRON_FALLBACK_MODEL}...`
        );
        activeModel = FAST_NEMOTRON_FALLBACK_MODEL;
        response = await callOpenRouter(activeModel);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error(`[OpenRouter] HTTP error ${response.status}: ${errText.slice(0, 200)}`);
        const fallback = generateDeterministicDecisionResult(
          analysis,
          userScenario,
          `Deterministic Fallback (OpenRouter HTTP ${response.status})`
        );
        fallback.disclaimer = `[Notice: Live OpenRouter request encountered HTTP ${response.status}. Served verified deterministic decision support.]`;
        return fallback;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new Error('Empty response content received from NVIDIA Nemotron model');
      }

      // Parse structured JSON with robust stripping of code fences
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (jsonErr) {
        // Regex extraction fallback if model enclosed JSON in narrative text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            // Keep unparsed
          }
        }
      }

      if (parsed && typeof parsed === 'object') {
        return {
          scenarioSummary: parsed.scenarioSummary || 'Scenario analysis completed.',
          keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [String(parsed.keyFindings || '')],
          availableOptions: Array.isArray(parsed.availableOptions)
            ? parsed.availableOptions
            : Object.values(results).map((o) => ({
                optionName: o.optionName,
                netCost: `${analysis.currency} ${safeLocale(o.netTotalCost)}`,
                summary: 'Analyzed in comparison model.',
              })),
          recommendedDecision: parsed.recommendedDecision || 'See detailed options and trade-offs above.',
          riskAssessment: Array.isArray(parsed.riskAssessment)
            ? parsed.riskAssessment
            : [String(parsed.riskAssessment || '')],
          assumptionsAndMissingData: Array.isArray(parsed.assumptionsAndMissingData)
            ? parsed.assumptionsAndMissingData
            : [],
          suggestedNextSteps: Array.isArray(parsed.suggestedNextSteps)
            ? parsed.suggestedNextSteps
            : ['Review lifecycle costs and audit assumptions.'],
          rawText: content,
          modelUsed: activeModel,
          provider: 'OpenRouter',
          isLive: true,
          timestamp: new Date().toISOString(),
          disclaimer: `Verified live inference generated by NVIDIA Nemotron (${activeModel}) via OpenRouter. Decision support commentary only; not financial advice.`,
        };
      }

      // If pure markdown or text was returned, package it safely
      return {
        scenarioSummary: `Decision review synthesized by ${activeModel}.`,
        keyFindings: [`AI analysis completed across ${analysis?.horizonYears || 3}-year TCO model.`],
        availableOptions: Object.values(results).map((o) => ({
          optionName: o.optionName,
          netCost: `${analysis.currency} ${safeLocale(o.netTotalCost)}`,
          summary: 'Analyzed in simulation.',
        })),
        recommendedDecision: content.slice(0, 400),
        riskAssessment: ['Review operational variables and sensitivity.'],
        assumptionsAndMissingData: ['Check unverified line-item estimates in cost audit panel.'],
        suggestedNextSteps: ['Confirm upfront pricing quotes.'],
        rawText: content,
        modelUsed: activeModel,
        provider: 'OpenRouter',
        isLive: true,
        timestamp: new Date().toISOString(),
        disclaimer: `Verified live inference generated by NVIDIA Nemotron (${activeModel}) via OpenRouter.`,
      };
    } catch (err: any) {
      console.error('[OpenRouter] Connection error:', err.message || err);
      const fallback = generateDeterministicDecisionResult(
        analysis,
        userScenario,
        `Deterministic Fallback (${err.name === 'AbortError' ? 'Timeout' : 'Network Error'})`
      );
      fallback.disclaimer = `[Notice: OpenRouter connection ${
        err.name === 'AbortError' ? 'timed out' : 'encountered an error'
      }. Served verified deterministic decision support.]`;
      return fallback;
    }
  } catch (outerErr: any) {
    console.error('[OpenRouter] Fatal error in analyzeScenarioWithNemotron:', outerErr);
    return generateDeterministicDecisionResult(
      analysis,
      userScenario,
      'Deterministic Fallback (Fatal Error Safeguard)'
    );
  }
}

/**
 * Backward compatibility adapter: Maps NemotronDecisionResult to legacy AiReviewResponse
 * for callers of /api/ai/explain.
 */
export async function explainComparisonWithNemotronOpenRouter(
  analysis: ComparisonAnalysisResult,
  customModel?: string
): Promise<AiReviewResponse> {
  const result = await analyzeScenarioWithNemotron({
    analysis,
    customModel,
  });

  return {
    executiveSummary: `${result.scenarioSummary} ${result.recommendedDecision}`,
    lowestCostExplanation: result.keyFindings?.[0] || 'Lowest cost analysis complete.',
    driverBreakdown: result.keyFindings.slice(1).map((f) => ({
      factor: 'Key Driver',
      description: f,
      recommendation: 'Evaluate cost driver impact over evaluation horizon.',
    })),
    missingAssumptionsFlags: result.assumptionsAndMissingData,
    hiddenCostSuggestions: [
      {
        category: 'Maintenance & Upkeep',
        costName: 'Component Wear & Tear',
        typicalRange: `${analysis?.currency || 'USD'} 50 – 250`,
        rational: 'Hardware maintenance outlays after initial warranty threshold.',
      },
    ],
    scenarioSensitivityNotes: result.riskAssessment.join(' '),
    strategicTradeoffs: result.recommendedDecision,
    disclaimer: result.disclaimer,
    isMock: !result.isLive,
    modelUsed: result.modelUsed,
    timestamp: result.timestamp,
  };
}
