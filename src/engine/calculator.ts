/**
 * Deterministic Cost Calculation Engine for VeraCost Platform
 *
 * Implements transparent, verifiable Total Cost of Ownership (TCO) calculations
 * over configurable time horizons with scenario simulation and cashflow modeling.
 */

import {
  BillingFrequency,
  ComparisonOption,
  ComparisonProject,
  CostItem,
  MonthlyCashflowPoint,
  OptionCalculationResult,
  ComparisonAnalysisResult,
  ScenarioType,
} from '../types/cost';

/**
 * Normalizes any billing frequency into its monthly equivalent value
 */
export function normalizeFrequencyToMonthly(amount: number, frequency?: BillingFrequency): number {
  if (!amount || isNaN(amount) || amount < 0) return 0;
  switch (frequency) {
    case 'daily':
      return (amount * 365) / 12;
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'annual':
      return amount / 12;
    case 'one-time':
    default:
      return 0; // handled as a non-periodic lump sum
  }
}

/**
 * Calculates total expenditure for a cost item over an arbitrary horizon in months
 */
export function calculateItemTotalOverHorizon(
  item: CostItem,
  horizonMonths: number,
  scenarioMultiplier: number = 1.0
): number {
  if (!item.amount || isNaN(item.amount) || item.amount < 0 || item.isUnknown) {
    return 0;
  }

  const effectiveAmount = item.amount * scenarioMultiplier;

  if (item.frequency === 'one-time' || !item.frequency) {
    return effectiveAmount;
  }

  const monthlyRate = normalizeFrequencyToMonthly(effectiveAmount, item.frequency);
  return monthlyRate * horizonMonths;
}

/**
 * Get multiplier parameters for a given scenario
 */
export function getScenarioMultipliers(scenario: ScenarioType): {
  upfront: number;
  recurring: number;
  maintenance: number;
  operating: number;
  residual: number;
} {
  switch (scenario) {
    case 'lower':
      // Optimistic: lower maintenance & operating expenses, higher resale recovery
      return {
        upfront: 1.0,
        recurring: 0.95,
        maintenance: 0.80,
        operating: 0.85,
        residual: 1.15,
      };
    case 'higher':
      // Stress-test: higher maintenance, unexpected repairs, battery replacement, price inflation, reduced resale
      return {
        upfront: 1.0,
        recurring: 1.08,
        maintenance: 1.35,
        operating: 1.22,
        residual: 0.70,
      };
    case 'typical':
    default:
      return {
        upfront: 1.0,
        recurring: 1.0,
        maintenance: 1.0,
        operating: 1.0,
        residual: 1.0,
      };
  }
}

/**
 * Computes deterministic TCO for a single option over a specific horizon
 */
export function calculateOptionTco(
  option: ComparisonOption,
  horizonYears: number,
  scenario: ScenarioType = 'typical',
  discountRatePct: number = 0
): OptionCalculationResult {
  const horizonMonths = Math.max(1, Math.round(horizonYears * 12));
  const mult = getScenarioMultipliers(scenario);

  // 1. Initial Upfront Acquisition
  const purchasePrice = Math.max(0, option.initialPurchasePrice || 0);
  const salesTax = Math.max(0, option.salesTaxOrFees || 0);
  const initialAcquisitionTotal = purchasePrice + salesTax;

  // 2. Setup & Accessories
  const setupAccessoriesTotal = (option.setupAndAccessories || []).reduce((sum, item) => {
    return sum + calculateItemTotalOverHorizon(item, horizonMonths, mult.upfront);
  }, 0);

  // 3. Recurring Costs
  const recurringTotal = (option.recurringCosts || []).reduce((sum, item) => {
    return sum + calculateItemTotalOverHorizon(item, horizonMonths, mult.recurring);
  }, 0);

  // 4. Maintenance & Repairs
  const maintenanceTotal = (option.maintenanceCosts || []).reduce((sum, item) => {
    return sum + calculateItemTotalOverHorizon(item, horizonMonths, mult.maintenance);
  }, 0);

  // 5. Operating Costs
  const operatingTotal = (option.operatingCosts || []).reduce((sum, item) => {
    return sum + calculateItemTotalOverHorizon(item, horizonMonths, mult.operating);
  }, 0);

  // 6. Replacement Schedules
  let replacementTotal = 0;
  let replacementsOccurred = 0;
  const usefulLifeMonths = Math.max(1, Math.round((option.usefulLifeYears || 0) * 12));
  const replacementUnitCost = (option.replacementCostEstimate && option.replacementCostEstimate > 0)
    ? option.replacementCostEstimate
    : purchasePrice;

  if (option.replaceAtEndOfLife && usefulLifeMonths > 0 && usefulLifeMonths < horizonMonths) {
    // Replacement occurs at months usefulLifeMonths, 2*usefulLifeMonths, etc. before horizon
    replacementsOccurred = Math.floor((horizonMonths - 1) / usefulLifeMonths);
    // In higher scenario, replacement costs may inflate slightly (5%)
    const unitReplacementCostAdjusted = scenario === 'higher' 
      ? replacementUnitCost * 1.08 
      : replacementUnitCost;
    replacementTotal = replacementsOccurred * unitReplacementCostAdjusted;
  }

  // 7. Residual Recovery Value
  const rawResidual = Math.max(0, option.residualValueEstimate || 0);
  const residualRecoveryTotal = rawResidual * mult.residual;

  // 8. Totals
  const grossTotalCost = 
    initialAcquisitionTotal +
    setupAccessoriesTotal +
    recurringTotal +
    maintenanceTotal +
    operatingTotal +
    replacementTotal;

  const netTotalCost = Math.max(0, grossTotalCost - residualRecoveryTotal);
  const monthlyEquivalentCost = netTotalCost / horizonMonths;
  const annualEquivalentCost = monthlyEquivalentCost * 12;

  // 9. Timeline Construction (Month 0 to Month N)
  // Monthly rates for periodic components
  const monthlyRecurringRate = (option.recurringCosts || []).reduce(
    (sum, item) => sum + normalizeFrequencyToMonthly(item.amount * mult.recurring, item.frequency),
    0
  );
  const monthlyMaintenanceRate = (option.maintenanceCosts || []).reduce(
    (sum, item) => sum + normalizeFrequencyToMonthly(item.amount * mult.maintenance, item.frequency),
    0
  );
  const monthlyOperatingRate = (option.operatingCosts || []).reduce(
    (sum, item) => sum + normalizeFrequencyToMonthly(item.amount * mult.operating, item.frequency),
    0
  );

  const timeline: { month: number; cumulativeCost: number; periodicExpense: number }[] = [];
  
  // Month 0: Initial outlay + Setup
  let runningCumulative = initialAcquisitionTotal + setupAccessoriesTotal;
  timeline.push({
    month: 0,
    cumulativeCost: Math.round(runningCumulative * 100) / 100,
    periodicExpense: Math.round(runningCumulative * 100) / 100,
  });

  const monthlyDiscountRate = discountRatePct > 0 
    ? Math.pow(1 + discountRatePct / 100, 1 / 12) - 1 
    : 0;

  let presentValueSum = runningCumulative;

  for (let m = 1; m <= horizonMonths; m++) {
    let monthlyPeriodic = monthlyRecurringRate + monthlyMaintenanceRate + monthlyOperatingRate;

    // Check for replacement event in this month
    if (
      option.replaceAtEndOfLife &&
      usefulLifeMonths > 0 &&
      m % usefulLifeMonths === 0 &&
      m < horizonMonths
    ) {
      const unitReplacementCostAdjusted = scenario === 'higher' 
        ? replacementUnitCost * 1.08 
        : replacementUnitCost;
      monthlyPeriodic += unitReplacementCostAdjusted;
    }

    // End of horizon residual recovery reduction
    if (m === horizonMonths) {
      monthlyPeriodic -= residualRecoveryTotal;
    }

    runningCumulative += monthlyPeriodic;
    timeline.push({
      month: m,
      cumulativeCost: Math.round(runningCumulative * 100) / 100,
      periodicExpense: Math.round(monthlyPeriodic * 100) / 100,
    });

    if (monthlyDiscountRate > 0) {
      presentValueSum += monthlyPeriodic / Math.pow(1 + monthlyDiscountRate, m);
    }
  }

  // 10. Audit Confidence Aggregation
  let confirmedTotal = 0;
  let userEstimateTotal = 0;
  let externalSourceTotal = 0;
  let suggestedUnverifiedTotal = 0;
  let missingCount = 0;

  const allItems = [
    ...(option.setupAndAccessories || []),
    ...(option.recurringCosts || []),
    ...(option.maintenanceCosts || []),
    ...(option.operatingCosts || []),
  ];

  // Upfront item
  if (option.purchaseConfidence === 'confirmed') confirmedTotal += initialAcquisitionTotal;
  else if (option.purchaseConfidence === 'external-source') externalSourceTotal += initialAcquisitionTotal;
  else if (option.purchaseConfidence === 'missing') missingCount++;
  else userEstimateTotal += initialAcquisitionTotal;

  allItems.forEach(item => {
    const itemTotal = calculateItemTotalOverHorizon(item, horizonMonths, 1.0);
    if (item.confidence === 'confirmed') confirmedTotal += itemTotal;
    else if (item.confidence === 'external-source') externalSourceTotal += itemTotal;
    else if (item.confidence === 'suggested-unverified') suggestedUnverifiedTotal += itemTotal;
    else if (item.confidence === 'missing' || item.isUnknown) missingCount++;
    else userEstimateTotal += itemTotal;
  });

  if (option.residualConfidence === 'missing') missingCount++;

  return {
    optionId: option.id,
    optionName: option.name,
    currency: option.currency || 'USD',
    horizonYears,
    scenario,
    initialAcquisitionTotal: Math.round(initialAcquisitionTotal * 100) / 100,
    setupAccessoriesTotal: Math.round(setupAccessoriesTotal * 100) / 100,
    recurringTotal: Math.round(recurringTotal * 100) / 100,
    maintenanceTotal: Math.round(maintenanceTotal * 100) / 100,
    operatingTotal: Math.round(operatingTotal * 100) / 100,
    replacementTotal: Math.round(replacementTotal * 100) / 100,
    replacementsOccurred,
    residualRecoveryTotal: Math.round(residualRecoveryTotal * 100) / 100,
    grossTotalCost: Math.round(grossTotalCost * 100) / 100,
    netTotalCost: Math.round(netTotalCost * 100) / 100,
    monthlyEquivalentCost: Math.round(monthlyEquivalentCost * 100) / 100,
    annualEquivalentCost: Math.round(annualEquivalentCost * 100) / 100,
    presentValueNetTotal: Math.round((discountRatePct > 0 ? presentValueSum : netTotalCost) * 100) / 100,
    timeline,
    confidenceBreakdown: {
      confirmedTotal: Math.round(confirmedTotal * 100) / 100,
      userEstimateTotal: Math.round(userEstimateTotal * 100) / 100,
      externalSourceTotal: Math.round(externalSourceTotal * 100) / 100,
      suggestedUnverifiedTotal: Math.round(suggestedUnverifiedTotal * 100) / 100,
      missingCount,
    },
  };
}

/**
 * Calculates and compares all options in a project
 */
export function calculateComparison(project: ComparisonProject): ComparisonAnalysisResult {
  const results: Record<string, OptionCalculationResult> = {};
  const options = project.options || [];

  options.forEach(opt => {
    results[opt.id] = calculateOptionTco(
      opt,
      project.horizonYears,
      project.scenario,
      project.discountRatePct
    );
  });

  const optionIds = Object.keys(results);
  let lowestCostOptionId = optionIds[0] || '';
  let highestCostOptionId = optionIds[0] || '';

  optionIds.forEach(id => {
    if (results[id].netTotalCost < results[lowestCostOptionId].netTotalCost) {
      lowestCostOptionId = id;
    }
    if (results[id].netTotalCost > results[highestCostOptionId].netTotalCost) {
      highestCostOptionId = id;
    }
  });

  const lowestCost = results[lowestCostOptionId]?.netTotalCost || 0;
  const highestCost = results[highestCostOptionId]?.netTotalCost || 0;
  const netSavings = Math.max(0, highestCost - lowestCost);
  const percentageSavings = highestCost > 0 ? (netSavings / highestCost) * 100 : 0;

  // Identify Key Cost Drivers between lowest and highest
  const keyDrivers: {
    title: string;
    description: string;
    impactAmount: number;
    favorableToOptionId: string;
  }[] = [];

  if (optionIds.length >= 2 && lowestCostOptionId !== highestCostOptionId) {
    const low = results[lowestCostOptionId];
    const high = results[highestCostOptionId];

    // Acquisition delta
    const acqDelta = high.initialAcquisitionTotal - low.initialAcquisitionTotal;
    if (Math.abs(acqDelta) > 10) {
      keyDrivers.push({
        title: acqDelta > 0 ? 'Upfront Purchase Advantage' : 'Higher Initial Sticker Price',
        description: `${low.optionName} has a ${acqDelta > 0 ? 'lower' : 'higher'} initial sticker price difference of ${project.currency} ${Math.abs(acqDelta).toFixed(0)}.`,
        impactAmount: Math.abs(acqDelta),
        favorableToOptionId: acqDelta > 0 ? low.optionId : high.optionId,
      });
    }

    // Recurring delta
    const recDelta = high.recurringTotal - low.recurringTotal;
    if (Math.abs(recDelta) > 10) {
      keyDrivers.push({
        title: 'Recurring Subscriptions & Fees',
        description: `${recDelta > 0 ? low.optionName : high.optionName} saves ${project.currency} ${Math.abs(recDelta).toFixed(0)} in recurring services and subscriptions over ${project.horizonYears} years.`,
        impactAmount: Math.abs(recDelta),
        favorableToOptionId: recDelta > 0 ? low.optionId : high.optionId,
      });
    }

    // Maintenance delta
    const maintDelta = high.maintenanceTotal - low.maintenanceTotal;
    if (Math.abs(maintDelta) > 10) {
      keyDrivers.push({
        title: 'Maintenance & Repair Outlays',
        description: `Projected upkeep, servicing, and repairs differ by ${project.currency} ${Math.abs(maintDelta).toFixed(0)}.`,
        impactAmount: Math.abs(maintDelta),
        favorableToOptionId: maintDelta > 0 ? low.optionId : high.optionId,
      });
    }

    // Operating delta
    const opDelta = high.operatingTotal - low.operatingTotal;
    if (Math.abs(opDelta) > 10) {
      keyDrivers.push({
        title: 'Operating Energy & Consumables',
        description: `Utility, electricity, and consumable supplies differ by ${project.currency} ${Math.abs(opDelta).toFixed(0)} over the lifecycle.`,
        impactAmount: Math.abs(opDelta),
        favorableToOptionId: opDelta > 0 ? low.optionId : high.optionId,
      });
    }

    // Replacement delta
    const repDelta = high.replacementTotal - low.replacementTotal;
    if (Math.abs(repDelta) > 10) {
      keyDrivers.push({
        title: 'Longevity & Replacement Cycle',
        description: `Equipment replacement cycles contribute ${project.currency} ${Math.abs(repDelta).toFixed(0)} difference across the ${project.horizonYears}-year window.`,
        impactAmount: Math.abs(repDelta),
        favorableToOptionId: repDelta > 0 ? low.optionId : high.optionId,
      });
    }

    // Residual value delta
    const resDelta = low.residualRecoveryTotal - high.residualRecoveryTotal;
    if (Math.abs(resDelta) > 10) {
      keyDrivers.push({
        title: 'Residual Value & Resale Recovery',
        description: `${resDelta > 0 ? low.optionName : high.optionName} retains ${project.currency} ${Math.abs(resDelta).toFixed(0)} more recoverable equity at the end of the ownership period.`,
        impactAmount: Math.abs(resDelta),
        favorableToOptionId: resDelta > 0 ? low.optionId : high.optionId,
      });
    }
  }

  // Sort drivers by descending impact
  keyDrivers.sort((a, b) => b.impactAmount - a.impactAmount);

  // Generate monthly cashflow points across all options for chart synchronization
  const horizonMonths = Math.max(1, Math.round(project.horizonYears * 12));
  const monthlyCashflows: MonthlyCashflowPoint[] = [];

  for (let m = 0; m <= horizonMonths; m++) {
    const point: MonthlyCashflowPoint = {
      month: m,
      dateLabel: m === 0 ? 'Month 0 (Acquisition)' : `Month ${m} (Yr ${(m / 12).toFixed(1)})`,
      optionCosts: {},
    };

    options.forEach(opt => {
      const res = results[opt.id];
      const timeItem = res?.timeline.find(t => t.month === m);
      if (timeItem) {
        point.optionCosts[opt.id] = {
          monthlyExpense: timeItem.periodicExpense,
          cumulativeTotal: timeItem.cumulativeCost,
          breakdown: {
            recurring: res.recurringTotal / horizonMonths,
            maintenance: res.maintenanceTotal / horizonMonths,
            operating: res.operatingTotal / horizonMonths,
            replacement: 0,
          },
        };
      }
    });

    monthlyCashflows.push(point);
  }

  return {
    projectTitle: project.title,
    horizonYears: project.horizonYears,
    scenario: project.scenario,
    currency: project.currency,
    discountRatePct: project.discountRatePct || 0,
    results,
    lowestCostOptionId,
    highestCostOptionId,
    netSavings: Math.round(netSavings * 100) / 100,
    percentageSavings: Math.round(percentageSavings * 10) / 10,
    keyDrivers,
    monthlyCashflows,
  };
}
