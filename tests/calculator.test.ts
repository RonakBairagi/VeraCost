import { describe, it, expect } from 'vitest';
import {
  normalizeFrequencyToMonthly,
  calculateItemTotalOverHorizon,
  calculateOptionTco,
  calculateComparison,
  getScenarioMultipliers,
} from '../src/engine/calculator';
import { ComparisonOption, ComparisonProject, CostItem } from '../src/types/cost';

describe('Deterministic Calculator Engine', () => {
  describe('Frequency Normalization', () => {
    it('normalizes monthly billing accurately', () => {
      expect(normalizeFrequencyToMonthly(50, 'monthly')).toBe(50);
    });

    it('normalizes annual billing into monthly fractions', () => {
      expect(normalizeFrequencyToMonthly(120, 'annual')).toBe(10);
    });

    it('normalizes quarterly billing', () => {
      expect(normalizeFrequencyToMonthly(300, 'quarterly')).toBe(100);
    });

    it('normalizes weekly billing over 52 weeks per year', () => {
      expect(normalizeFrequencyToMonthly(10, 'weekly')).toBeCloseTo((10 * 52) / 12, 4);
    });

    it('normalizes daily billing over 365 days', () => {
      expect(normalizeFrequencyToMonthly(1, 'daily')).toBeCloseTo(365 / 12, 4);
    });

    it('handles negative or invalid values gracefully', () => {
      expect(normalizeFrequencyToMonthly(-100, 'monthly')).toBe(0);
      expect(normalizeFrequencyToMonthly(NaN as any, 'monthly')).toBe(0);
    });
  });

  describe('Item Total over Horizon', () => {
    it('calculates one-time item as fixed lump sum regardless of horizon', () => {
      const item: CostItem = {
        id: '1',
        name: 'Accessory Cable',
        category: 'setup',
        amount: 45,
        frequency: 'one-time',
        confidence: 'confirmed',
      };
      expect(calculateItemTotalOverHorizon(item, 12)).toBe(45);
      expect(calculateItemTotalOverHorizon(item, 60)).toBe(45);
    });

    it('multiplies recurring monthly charges over 36 months (3 years)', () => {
      const item: CostItem = {
        id: '2',
        name: 'Cloud Backup',
        category: 'recurring',
        amount: 15,
        frequency: 'monthly',
        confidence: 'confirmed',
      };
      expect(calculateItemTotalOverHorizon(item, 36)).toBe(540);
    });

    it('ignores unknown or flagged items so they do not distort calculations', () => {
      const item: CostItem = {
        id: '3',
        name: 'Uncertain Repair',
        category: 'maintenance',
        amount: 250,
        frequency: 'one-time',
        confidence: 'missing',
        isUnknown: true,
      };
      expect(calculateItemTotalOverHorizon(item, 36)).toBe(0);
    });
  });

  describe('Single Option TCO Calculation', () => {
    const sampleOption: ComparisonOption = {
      id: 'opt-macbook',
      name: 'MacBook Pro 14"',
      category: 'electronics',
      currency: 'USD',
      initialPurchasePrice: 1999,
      salesTaxOrFees: 160,
      purchaseConfidence: 'confirmed',
      setupAndAccessories: [
        {
          id: 'acc-1',
          name: 'USB-C Dock & Sleeve',
          category: 'setup',
          amount: 120,
          frequency: 'one-time',
          confidence: 'confirmed',
        },
      ],
      recurringCosts: [
        {
          id: 'rec-1',
          name: 'AppleCare+ Monthly',
          category: 'recurring',
          amount: 12,
          frequency: 'monthly',
          confidence: 'confirmed',
        },
      ],
      maintenanceCosts: [
        {
          id: 'maint-1',
          name: 'Battery Tune-up (Year 3)',
          category: 'maintenance',
          amount: 0,
          frequency: 'one-time',
          confidence: 'user-estimate',
        },
      ],
      operatingCosts: [
        {
          id: 'op-1',
          name: 'Electricity Consumption',
          category: 'operating',
          amount: 24, // $24 per year
          frequency: 'annual',
          confidence: 'external-source',
        },
      ],
      usefulLifeYears: 4,
      replaceAtEndOfLife: false,
      residualValueEstimate: 600,
      residualConfidence: 'external-source',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('correctly calculates 3-year TCO with residual recovery', () => {
      const result = calculateOptionTco(sampleOption, 3, 'typical');

      // Upfront: 1999 + 160 = 2159
      expect(result.initialAcquisitionTotal).toBe(2159);
      // Setup: 120
      expect(result.setupAccessoriesTotal).toBe(120);
      // Recurring: 12 * 36 = 432
      expect(result.recurringTotal).toBe(432);
      // Operating: (24/12) * 36 = 72
      expect(result.operatingTotal).toBe(72);
      // Residual: 600
      expect(result.residualRecoveryTotal).toBe(600);
      // Gross: 2159 + 120 + 432 + 72 = 2783
      expect(result.grossTotalCost).toBe(2783);
      // Net: 2783 - 600 = 2183
      expect(result.netTotalCost).toBe(2183);
      // Monthly equivalent: 2183 / 36 = 60.64
      expect(result.monthlyEquivalentCost).toBeCloseTo(60.64, 1);
    });

    it('correctly schedules replacements over extended horizons', () => {
      // Useful life = 3 years. Horizon = 5 years.
      // Replacement occurs at month 36 (exactly 1 replacement before month 60).
      const optionWithReplacement: ComparisonOption = {
        ...sampleOption,
        usefulLifeYears: 3,
        replaceAtEndOfLife: true,
        replacementCostEstimate: 1800,
      };

      const result = calculateOptionTco(optionWithReplacement, 5, 'typical');
      expect(result.replacementsOccurred).toBe(1);
      expect(result.replacementTotal).toBe(1800);
    });

    it('applies scenario stress multipliers correctly', () => {
      const typicalResult = calculateOptionTco(sampleOption, 3, 'typical');
      const higherResult = calculateOptionTco(sampleOption, 3, 'higher');
      const lowerResult = calculateOptionTco(sampleOption, 3, 'lower');

      // Higher scenario increases recurring & operating, and lowers residual recovery
      expect(higherResult.netTotalCost).toBeGreaterThan(typicalResult.netTotalCost);
      expect(lowerResult.netTotalCost).toBeLessThan(typicalResult.netTotalCost);
      expect(lowerResult.residualRecoveryTotal).toBeGreaterThan(typicalResult.residualRecoveryTotal);
    });

    it('handles zero and missing inputs without NaN', () => {
      const blankOption: ComparisonOption = {
        id: 'opt-blank',
        name: 'Blank Item',
        category: 'other',
        currency: 'USD',
        initialPurchasePrice: 0,
        salesTaxOrFees: 0,
        purchaseConfidence: 'missing',
        setupAndAccessories: [],
        recurringCosts: [],
        maintenanceCosts: [],
        operatingCosts: [],
        usefulLifeYears: 0,
        replaceAtEndOfLife: false,
        residualValueEstimate: 0,
        residualConfidence: 'missing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = calculateOptionTco(blankOption, 3, 'typical');
      expect(result.netTotalCost).toBe(0);
      expect(result.monthlyEquivalentCost).toBe(0);
      expect(isNaN(result.netTotalCost)).toBe(false);
      expect(result.confidenceBreakdown.missingCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Comparison & Driver Analysis', () => {
    it('compares two options and identifies lowest cost and key driver', () => {
      const optionA: ComparisonOption = {
        id: 'opt-a',
        name: 'Cheap Sticker, Expensive Upkeep Printer',
        category: 'electronics',
        currency: 'USD',
        initialPurchasePrice: 150,
        salesTaxOrFees: 15,
        purchaseConfidence: 'confirmed',
        setupAndAccessories: [],
        recurringCosts: [],
        maintenanceCosts: [],
        operatingCosts: [
          {
            id: 'ink',
            name: 'Proprietary Ink Cartridges',
            category: 'operating',
            amount: 60, // $60/month ink
            frequency: 'monthly',
            confidence: 'confirmed',
          },
        ],
        usefulLifeYears: 3,
        replaceAtEndOfLife: false,
        residualValueEstimate: 10,
        residualConfidence: 'user-estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const optionB: ComparisonOption = {
        id: 'opt-b',
        name: 'EcoTank Printer (Higher Initial Cost)',
        category: 'electronics',
        currency: 'USD',
        initialPurchasePrice: 450,
        salesTaxOrFees: 45,
        purchaseConfidence: 'confirmed',
        setupAndAccessories: [],
        recurringCosts: [],
        maintenanceCosts: [],
        operatingCosts: [
          {
            id: 'ink-bottle',
            name: 'Bulk Ink Bottles',
            category: 'operating',
            amount: 5, // $5/month ink
            frequency: 'monthly',
            confidence: 'confirmed',
          },
        ],
        usefulLifeYears: 5,
        replaceAtEndOfLife: false,
        residualValueEstimate: 80,
        residualConfidence: 'user-estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const project: ComparisonProject = {
        id: 'proj-1',
        title: 'Printer TCO Comparison',
        category: 'electronics',
        currency: 'USD',
        horizonYears: 3,
        discountRatePct: 0,
        scenario: 'typical',
        options: [optionA, optionB],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const comparison = calculateComparison(project);

      // Over 36 months:
      // Option A: 165 upfront + (60 * 36 = 2160) - 10 residual = 2315
      // Option B: 495 upfront + (5 * 36 = 180) - 80 residual = 595
      expect(comparison.lowestCostOptionId).toBe('opt-b');
      expect(comparison.highestCostOptionId).toBe('opt-a');
      expect(comparison.netSavings).toBe(1720);
      expect(comparison.percentageSavings).toBeCloseTo((1720 / 2315) * 100, 1);
      
      // Check that Operating Consumables was detected as a primary driver
      const opDriver = comparison.keyDrivers.find(d => d.title.includes('Operating'));
      expect(opDriver).toBeDefined();
      expect(opDriver?.favorableToOptionId).toBe('opt-b');
    });
  });
});
