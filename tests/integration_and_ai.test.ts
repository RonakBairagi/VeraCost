import { describe, it, expect } from 'vitest';
import { generateMockNemotronReview } from '../server/mockNemotron';
import { calculateComparison } from '../src/engine/calculator';
import { SAMPLE_COMPARISONS } from '../src/data/sampleComparisons';

describe('Integration, AI & Persistence Verification', () => {
  const sampleProject = SAMPLE_COMPARISONS[0]; // Laptops
  const analysis = calculateComparison(sampleProject);

  describe('Deterministic Mock Nemotron Reasoning Engine', () => {
    it('generates structured Nemotron review strictly matching calculated results', () => {
      const review = generateMockNemotronReview(analysis);

      expect(review).toBeDefined();
      expect(review.isMock).toBe(true);
      expect(review.executiveSummary).toContain(analysis.results[analysis.lowestCostOptionId].optionName);
      expect(review.executiveSummary).toContain(analysis.netSavings.toLocaleString());
      expect(review.disclaimer).toContain('MOCK MODE ACTIVE');
      expect(review.driverBreakdown.length).toBeGreaterThan(0);
      expect(review.hiddenCostSuggestions.length).toBeGreaterThan(0);
    });

    it('identifies unestimated or missing cost flags in audit profile', () => {
      const modifiedProject = JSON.parse(JSON.stringify(sampleProject));
      modifiedProject.options[0].purchaseConfidence = 'missing';
      const modifiedAnalysis = calculateComparison(modifiedProject);

      const review = generateMockNemotronReview(modifiedAnalysis);
      const hasMissingFlag = review.missingAssumptionsFlags.some((f) => f.includes('missing') || f.includes('uncertainty'));
      expect(hasMissingFlag).toBe(true);
    });

    it('contains no NaN or undefined placeholders in text outputs', () => {
      const review = generateMockNemotronReview(analysis);
      const jsonStr = JSON.stringify(review);
      expect(jsonStr).not.toContain('NaN');
      expect(jsonStr).not.toContain('undefined');
    });
  });

  describe('Comparison Persistence & Serialization', () => {
    it('serializes and deserializes ComparisonProject without loss of structure', () => {
      const serialized = JSON.stringify(sampleProject);
      const restored = JSON.parse(serialized);

      expect(restored.id).toBe(sampleProject.id);
      expect(restored.options.length).toBe(sampleProject.options.length);
      expect(restored.options[0].setupAndAccessories.length).toBe(
        sampleProject.options[0].setupAndAccessories.length
      );
    });

    it('recalculates consistently after deserialization', () => {
      const serialized = JSON.stringify(sampleProject);
      const restored = JSON.parse(serialized);
      const newAnalysis = calculateComparison(restored);

      expect(newAnalysis.netSavings).toBe(analysis.netSavings);
      expect(newAnalysis.lowestCostOptionId).toBe(analysis.lowestCostOptionId);
      expect(newAnalysis.percentageSavings).toBe(analysis.percentageSavings);
    });
  });

  describe('Scenario Sensitivity Consistency', () => {
    it('proves that higher cost scenario always results in higher net costs than lower cost scenario', () => {
      const higherProj = { ...sampleProject, scenario: 'higher' as const };
      const lowerProj = { ...sampleProject, scenario: 'lower' as const };

      const higherRes = calculateComparison(higherProj);
      const lowerRes = calculateComparison(lowerProj);

      sampleProject.options.forEach((opt) => {
        expect(higherRes.results[opt.id].netTotalCost).toBeGreaterThan(
          lowerRes.results[opt.id].netTotalCost
        );
      });
    });
  });
});
