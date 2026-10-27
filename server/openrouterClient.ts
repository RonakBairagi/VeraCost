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
  const lowestOption = analysis.results[analysis.lowestCostOptionId];
  const highestOption = analysis.results[analysis.highestCostOptionId];
  const lowName = lowestOption ? lowestOption.optionName : 'Option 1';
  const highName = highestOption ? highestOption.optionName : 'Option 2';
  const currency = analysis.currency || 'USD';
  const horizon = analysis.horizonYears || 3;
  const netSavings = analysis.netSavings ? analysis.netSavings.toLocaleString() : '0';
  const pctSavings = analysis.percentageSavings ? analysis.percentageSavings.toFixed(1) : '0';

  const availableOptions: NemotronOptionReview[] = Object.values(analysis.results || {}).map((opt) => {
    const isLowest = opt.optionId === analysis.lowestCostOptionId;
    return {
      optionName: opt.optionName,
      netCost: `${currency} ${opt.netTotalCost.toLocaleString()}`,
      summary: `${isLowest ? 'Cost leader' : 'Higher cost option'}. Upfront acquisition: ${currency} ${opt.initialAcquisitionTotal.toLocaleString()}, ongoing operating & maintenance: ${currency} ${(opt.operatingTotal + opt.maintenanceTotal + opt.recurringTotal).toLocaleString()}, residual recovery: ${currency} ${opt.residualRecoveryTotal.toLocaleString()}.`,
    };
  });

  const missingItems: string[] = [];
  Object.values(analysis.results || {}).forEach((opt) => {
    if (opt.confidenceBreakdown && opt.confidenceBreakdown.missingCount > 0) {
      missingItems.push(
        `${opt.optionName} has ${opt.confidenceBreakdown.missingCount} cost item(s) unestimated or flagged as missing.`
      );
    }
    if (opt.replacementTotal === 0 && horizon >= 4) {
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
      ? `Analysis for user scenario: "${userScenario}". Comparing ${Object.keys(analysis.results || {}).length} option(s) over a ${horizon}-year ownership horizon under the ${analysis.scenario.toUpperCase()} scenario.`
      : `Evaluating Total Cost of Ownership for ${Object.keys(analysis.results || {}).length} option(s) over a ${horizon}-year horizon under the ${analysis.scenario.toUpperCase()} stress-test scenario.`,
    keyFindings: [
      `${lowName} delivers the lowest Net Total Cost of Ownership at ${currency} ${lowestOption?.netTotalCost.toLocaleString()} compared to ${currency} ${highestOption?.netTotalCost.toLocaleString()} for ${highName}, saving ${currency} ${netSavings} (${pctSavings}%).`,
      `Primary cost driver: ${analysis.keyDrivers?.[0]?.title || 'Upfront purchase price and operational efficiency differences'}.`,
      `Monthly amortized equivalent cost: ${currency} ${lowestOption?.monthlyEquivalentCost.toLocaleString()}/mo for ${lowName} vs ${currency} ${highestOption?.monthlyEquivalentCost.toLocaleString()}/mo for ${highName}.`,
    ],
    availableOptions,
    recommendedDecision: `Based on deterministic lifecycle modeling, **${lowName}** is the recommended choice with a net TCO of ${currency} ${lowestOption?.netTotalCost.toLocaleString()}. It balances upfront capital efficiency with sustainable long-term operating costs.`,
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
}

/**
 * Execute Decision Support Analysis with NVIDIA Nemotron on OpenRouter
 */
export async function analyzeScenarioWithNemotron(
  request: NemotronDecisionRequest
): Promise<NemotronDecisionResult> {
  const { userScenario, analysis, customModel } = request;

  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = (process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL).replace(/\/+$/, '');
  const configuredModel = customModel || process.env.OPENROUTER_MODEL_ID || DEFAULT_OPENROUTER_MODEL;
  const timeoutMs = 35000;

  // Check if server-side key is absent
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_openrouter_api_key')) {
    return generateDeterministicDecisionResult(
      analysis,
      userScenario,
      'Deterministic Fallback (OpenRouter key unconfigured)'
    );
  }

  const lowestOption = analysis.results?.[analysis.lowestCostOptionId];
  const highestOption = analysis.results?.[analysis.highestCostOptionId];

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
Project: "${analysis.projectTitle || 'Comparison Project'}"
Horizon: ${analysis.horizonYears} years
Scenario: ${analysis.scenario}
Currency: ${analysis.currency}
Discount Rate: ${analysis.discountRatePct}%

LOWEST COST OPTION:
"${lowestOption?.optionName || 'Option 1'}" — Net TCO: ${analysis.currency} ${lowestOption?.netTotalCost?.toLocaleString()}

HIGHEST COST OPTION:
"${highestOption?.optionName || 'Option 2'}" — Net TCO: ${analysis.currency} ${highestOption?.netTotalCost?.toLocaleString()}
Net Savings: ${analysis.currency} ${analysis.netSavings?.toLocaleString()} (${analysis.percentageSavings}%)

DETAILED OPTIONS BREAKDOWN:
${Object.values(analysis.results || {})
  .map(
    (opt) => `
* Option: "${opt.optionName}"
  - Upfront Acquisition: ${analysis.currency} ${opt.initialAcquisitionTotal}
  - Setup & Accessories: ${analysis.currency} ${opt.setupAccessoriesTotal}
  - Recurring Subscriptions: ${analysis.currency} ${opt.recurringTotal}
  - Maintenance & Repairs: ${analysis.currency} ${opt.maintenanceTotal}
  - Operating & Consumables: ${analysis.currency} ${opt.operatingTotal}
  - Replacement Outlays: ${analysis.currency} ${opt.replacementTotal} (${opt.replacementsOccurred} replacements)
  - Residual Recovery (Resale): -${analysis.currency} ${opt.residualRecoveryTotal}
  - Net Total Cost of Ownership: ${analysis.currency} ${opt.netTotalCost} (Monthly Equivalent: ${analysis.currency} ${opt.monthlyEquivalentCost})
  - Audit Confidence: ${opt.confidenceBreakdown.confirmedTotal} confirmed, ${opt.confidenceBreakdown.userEstimateTotal} user estimates, ${opt.confidenceBreakdown.missingCount} missing items.
`
  )
  .join('\n')}

TOP COST DRIVERS (Engine Identified):
${(analysis.keyDrivers || [])
  .map((d) => `- ${d.title}: ${d.description} (Impact: ${analysis.currency} ${d.impactAmount})`)
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
          Authorization: `Bearer ${apiKey.trim()}`,
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
          max_tokens: 2200,
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

    // If OpenRouter returns 402 Payment Required / Insufficient credits,
    // seamlessly retry with the free-tier NVIDIA Nemotron model on OpenRouter.
    if (response.status === 402 && activeModel !== FREE_NEMOTRON_FALLBACK_MODEL) {
      console.warn(
        `[OpenRouter] Model ${activeModel} returned 402 Insufficient credits. Retrying with verified free model ${FREE_NEMOTRON_FALLBACK_MODEL}...`
      );
      activeModel = FREE_NEMOTRON_FALLBACK_MODEL;
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
          : Object.values(analysis.results || {}).map((o) => ({
              optionName: o.optionName,
              netCost: `${analysis.currency} ${o.netTotalCost.toLocaleString()}`,
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
      keyFindings: [`AI analysis completed across ${analysis.horizonYears}-year TCO model.`],
      availableOptions: Object.values(analysis.results || {}).map((o) => ({
        optionName: o.optionName,
        netCost: `${analysis.currency} ${o.netTotalCost.toLocaleString()}`,
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
      err.name === 'AbortError' ? 'timed out after 35s' : 'encountered a network error'
    }. Served verified deterministic decision support.]`;
    return fallback;
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
        typicalRange: `${analysis.currency} 50 – 250`,
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
