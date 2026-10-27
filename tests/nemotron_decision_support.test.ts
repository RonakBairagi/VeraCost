import { describe, it, expect } from 'vitest';
import {
  generateDeterministicDecisionResult,
  DEFAULT_OPENROUTER_MODEL,
  FREE_NEMOTRON_FALLBACK_MODEL,
  DEFAULT_OPENROUTER_BASE_URL,
} from '../server/openrouterClient';
import { ComparisonAnalysisResult } from '../src/types/cost';

describe('NVIDIA Nemotron Decision Support System Integration', () => {
  const sampleAnalysis: ComparisonAnalysisResult = {
    projectTitle: 'Enterprise Laptop Deployment',
    horizonYears: 3,
    scenario: 'typical',
    currency: 'USD',
    discountRatePct: 0,
    lowestCostOptionId: 'opt-mac',
    highestCostOptionId: 'opt-pc',
    netSavings: 450,
    percentageSavings: 18.5,
    keyDrivers: [
      {
        title: 'Initial Acquisition',
        description: 'Mac is $300 lower upfront outlay',
        impactAmount: 300,
        favorableToOptionId: 'opt-mac',
      },
      {
        title: 'Operating Power Draw',
        description: 'Lower energy usage across 36 months saves $150',
        impactAmount: 150,
        favorableToOptionId: 'opt-mac',
      },
    ],
    results: {
      'opt-mac': {
        optionId: 'opt-mac',
        optionName: 'MacBook Air M3',
        currency: 'USD',
        horizonYears: 3,
        scenario: 'typical',
        initialAcquisitionTotal: 1099,
        setupAccessoriesTotal: 150,
        recurringTotal: 0,
        maintenanceTotal: 80,
        operatingTotal: 90,
        replacementTotal: 0,
        replacementsOccurred: 0,
        residualRecoveryTotal: 350,
        grossTotalCost: 1419,
        netTotalCost: 1069,
        monthlyEquivalentCost: 29.69,
        annualEquivalentCost: 356.33,
        presentValueNetTotal: 1069,
        timeline: [],
        confidenceBreakdown: {
          confirmedTotal: 1099,
          userEstimateTotal: 320,
          externalSourceTotal: 0,
          suggestedUnverifiedTotal: 0,
          missingCount: 0,
        },
      },
      'opt-pc': {
        optionId: 'opt-pc',
        optionName: 'Dell XPS 13',
        currency: 'USD',
        horizonYears: 3,
        scenario: 'typical',
        initialAcquisitionTotal: 1399,
        setupAccessoriesTotal: 120,
        recurringTotal: 0,
        maintenanceTotal: 120,
        operatingTotal: 180,
        replacementTotal: 0,
        replacementsOccurred: 0,
        residualRecoveryTotal: 300,
        grossTotalCost: 1819,
        netTotalCost: 1519,
        monthlyEquivalentCost: 42.19,
        annualEquivalentCost: 506.33,
        presentValueNetTotal: 1519,
        timeline: [],
        confidenceBreakdown: {
          confirmedTotal: 1399,
          userEstimateTotal: 420,
          externalSourceTotal: 0,
          suggestedUnverifiedTotal: 0,
          missingCount: 0,
        },
      },
    },
    monthlyCashflows: [],
  };

  it('verifies default OpenRouter configuration and model IDs', () => {
    expect(DEFAULT_OPENROUTER_BASE_URL).toBe('https://openrouter.ai/api/v1');
    expect(DEFAULT_OPENROUTER_MODEL).toBe('nvidia/nemotron-3-ultra-550b-a55b');
    expect(FREE_NEMOTRON_FALLBACK_MODEL).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
  });

  it('generates complete 7-section deterministic decision support when offline', () => {
    const result = generateDeterministicDecisionResult(
      sampleAnalysis,
      'Which laptop has lower total cost of ownership and lowest upgrade risk for a remote team?'
    );

    // Verify all 7 core sections are populated
    expect(result.scenarioSummary).toBeDefined();
    expect(result.scenarioSummary.length).toBeGreaterThan(20);

    expect(Array.isArray(result.keyFindings)).toBe(true);
    expect(result.keyFindings.length).toBeGreaterThanOrEqual(2);

    expect(Array.isArray(result.availableOptions)).toBe(true);
    expect(result.availableOptions.length).toBe(2);
    expect(result.availableOptions[0].optionName).toBe('MacBook Air M3');
    expect(result.availableOptions[0].netCost).toContain('USD 1,069');

    expect(result.recommendedDecision).toBeDefined();
    expect(result.recommendedDecision).toContain('MacBook Air M3');

    expect(Array.isArray(result.riskAssessment)).toBe(true);
    expect(result.riskAssessment.length).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(result.assumptionsAndMissingData)).toBe(true);
    expect(result.assumptionsAndMissingData.length).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(result.suggestedNextSteps)).toBe(true);
    expect(result.suggestedNextSteps.length).toBeGreaterThanOrEqual(1);

    // Verify metadata
    expect(result.provider).toBe('OpenRouter');
    expect(result.isLive).toBe(false);
    expect(result.disclaimer).toContain('deterministic');
  });

  it('preserves exact numeric TCO totals computed by the simulator without fabrication', () => {
    const result = generateDeterministicDecisionResult(sampleAnalysis);
    const lowOption = result.availableOptions.find((o) => o.optionName === 'MacBook Air M3');
    const highOption = result.availableOptions.find((o) => o.optionName === 'Dell XPS 13');

    expect(lowOption?.netCost).toBe('USD 1,069');
    expect(highOption?.netCost).toBe('USD 1,519');
    expect(result.keyFindings[0]).toContain('1,069');
    expect(result.keyFindings[0]).toContain('1,519');
    expect(result.keyFindings[0]).toContain('450');
  });

  it('flags unestimated items and missing data accurately', () => {
    const analysisWithMissing: ComparisonAnalysisResult = {
      ...sampleAnalysis,
      results: {
        ...sampleAnalysis.results,
        'opt-mac': {
          ...sampleAnalysis.results['opt-mac'],
          confidenceBreakdown: {
            ...sampleAnalysis.results['opt-mac'].confidenceBreakdown,
            missingCount: 2,
          },
        },
      },
    };

    const result = generateDeterministicDecisionResult(analysisWithMissing);
    const missingFlag = result.assumptionsAndMissingData.find((item) =>
      item.includes('2 cost item(s) unestimated')
    );
    expect(missingFlag).toBeDefined();
  });
});
