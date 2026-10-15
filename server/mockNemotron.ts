/**
 * Deterministic Mock AI Provider for NVIDIA Nemotron
 *
 * Used when NEBIUS_API_KEY is not configured in the environment.
 * Generates structured, evidence-aware financial reasoning based strictly
 * on the calculated numbers, without modifying any numbers.
 * Clearly tagged as mock data per hackathon requirements.
 */

import { ComparisonAnalysisResult, AiReviewResponse } from '../src/types/cost';

export function generateMockNemotronReview(analysis: ComparisonAnalysisResult): AiReviewResponse {
  const lowestOption = analysis.results[analysis.lowestCostOptionId];
  const highestOption = analysis.results[analysis.highestCostOptionId];

  const lowName = lowestOption ? lowestOption.optionName : 'Option A';
  const highName = highestOption ? highestOption.optionName : 'Option B';
  const currency = analysis.currency || 'USD';
  const horizon = analysis.horizonYears;
  const savings = analysis.netSavings.toLocaleString();
  const pct = analysis.percentageSavings.toFixed(1);

  // Analyze primary driver
  const topDriver = analysis.keyDrivers[0];
  const driverText = topDriver
    ? `The primary cost differentiator is "${topDriver.title}" with a delta of ${currency} ${topDriver.impactAmount.toLocaleString()}, favoring ${
        topDriver.favorableToOptionId === analysis.lowestCostOptionId ? lowName : highName
      }.`
    : `Costs across the options remain relatively balanced over the ${horizon}-year evaluation window.`;

  // Flag missing items
  const missingFlags: string[] = [];
  Object.values(analysis.results).forEach(res => {
    if (res.confidenceBreakdown.missingCount > 0) {
      missingFlags.push(
        `${res.optionName} has ${res.confidenceBreakdown.missingCount} cost item(s) unestimated or flagged as missing, which adds uncertainty to the calculated bottom line.`
      );
    }
    if (res.replacementTotal === 0 && horizon >= 5) {
      missingFlags.push(
        `For ${res.optionName}, no replacement cycle is modeled over a ${horizon}-year horizon. Verify whether battery degradation or hardware obsolescence requires a mid-cycle refresh.`
      );
    }
  });

  if (missingFlags.length === 0) {
    missingFlags.push(
      `All primary expense categories for ${lowName} and ${highName} have established estimates or confirmed price points.`
    );
  }

  // Hidden suggestions
  const hiddenCostSuggestions = [
    {
      category: 'Maintenance & Upkeep',
      costName: 'Preventive Component Replacement',
      typicalRange: `${currency} 50 – ${currency} 250`,
      rational: `Wear-and-tear items frequently experience accelerated failure after the 24-month manufacturer warranty threshold.`,
    },
    {
      category: 'Operating Utilities',
      costName: 'Standby Power Draw & Utility Inflation',
      typicalRange: `${currency} 20 – ${currency} 80 / yr`,
      rational: `Utility tariffs often experience 3–6% annual rate inflation, widening operational cost disparities over ${horizon} years.`,
    },
    {
      category: 'Residual Recovery',
      costName: 'Secondary Market Depreciation Curve',
      typicalRange: `15% – 35% residual recovery`,
      rational: `Actual resale values depend heavily on physical cosmetic grading and release of successor models.`,
    },
  ];

  return {
    executiveSummary: `Across a ${horizon}-year ownership horizon under the ${analysis.scenario.toUpperCase()} scenario, ${lowName} delivers the lowest Total Cost of Ownership (TCO) at ${currency} ${lowestOption?.netTotalCost.toLocaleString()} compared to ${currency} ${highestOption?.netTotalCost.toLocaleString()} for ${highName}. Choosing ${lowName} yields a net savings of ${currency} ${savings} (${pct}% reduction).`,
    lowestCostExplanation: `${lowName} achieves cost leadership primarily due to ${
      lowestOption?.initialAcquisitionTotal < (highestOption?.initialAcquisitionTotal || 0)
        ? 'lower initial capital outlay combined with controlled operating expenses'
        : 'significantly lower ongoing operating and maintenance overhead that offsets its higher initial purchase price'
    }. ${driverText}`,
    driverBreakdown: analysis.keyDrivers.slice(0, 3).map(driver => ({
      factor: driver.title,
      description: driver.description,
      recommendation: `Verify whether negotiated vendor pricing, third-party warranty alternatives, or energy-saver modes can mitigate this variance.`,
    })),
    missingAssumptionsFlags: missingFlags,
    hiddenCostSuggestions,
    scenarioSensitivityNotes: `In a Stress-Test (Higher-Cost) scenario, increased maintenance frequencies and accelerated battery degradation widen the TCO gap by an estimated 18–25%. Conversely, in an Optimistic scenario with maximum residual recovery, the net difference narrows.`,
    strategicTradeoffs: `While ${lowName} provides superior financial efficiency, decision-makers must balance raw cost against performance margins, vendor ecosystem lock-in, and anticipated warranty responsiveness.`,
    disclaimer: `[SIMULATED DATA - MOCK MODE ACTIVE]: Nebius Token Factory credentials were not detected in the environment. This explanation was deterministically synthesized using VeraCost's fallback reasoning engine. To activate live NVIDIA Nemotron intelligence, configure NEBIUS_API_KEY in .env.`,
    isMock: true,
    modelUsed: 'Deterministic Fallback (NVIDIA Nemotron Scaffold)',
    timestamp: new Date().toISOString(),
  };
}
