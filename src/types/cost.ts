/**
 * Comprehensive Cost Data Model & Types for VeraCost Platform
 */

export type ConfidenceLevel = 
  | 'confirmed'             // Verified receipt, vendor quote, or official price
  | 'user-estimate'         // User-provided assumption
  | 'external-source'       // Benchmark, research citation, or external data
  | 'suggested-unverified'  // Discovered from rules engine, requires verification
  | 'missing';              // Explicitly flagged as unestimated or unknown

export type BillingFrequency = 
  | 'one-time'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual';

export type ProductCategory = 
  | 'smartphones'
  | 'electronics'
  | 'audio-wearables'
  | 'gaming'
  | 'appliances'
  | 'vehicles'
  | 'cloud-software'
  | 'home-garden'
  | 'custom'
  | 'other';

export type ScenarioType = 'typical' | 'lower' | 'higher';

export interface SourceReference {
  url?: string;
  sourceName?: string;
  retrievalDate?: string;
  notes?: string;
  isVerified?: boolean;
}

export interface CostItem {
  id: string;
  name: string;
  category: 'upfront' | 'setup' | 'recurring' | 'maintenance' | 'operating' | 'replacement' | 'residual';
  amount: number;
  frequency?: BillingFrequency;
  confidence: ConfidenceLevel;
  source?: SourceReference;
  notes?: string;
  isUnknown?: boolean;
}

export interface ComparisonOption {
  id: string;
  name: string;
  category: ProductCategory;
  currency: string;
  brandOrModel?: string;
  notes?: string;
  
  // Upfront acquisition
  initialPurchasePrice: number;
  salesTaxOrFees: number;
  purchaseConfidence: ConfidenceLevel;
  purchaseSource?: SourceReference;

  // Setup & accessories
  setupAndAccessories: CostItem[];

  // Recurring costs (subscriptions, insurance, warranties)
  recurringCosts: CostItem[];

  // Maintenance & repairs (scheduled service, wear, battery/part replacement)
  maintenanceCosts: CostItem[];

  // Operating costs (power/energy, fuel, consumables, toner, filters)
  operatingCosts: CostItem[];

  // Replacement assumptions & longevity
  usefulLifeYears: number; // e.g. 3 years
  replaceAtEndOfLife: boolean;
  replacementCostEstimate?: number; // if empty, defaults to purchase price

  // Residual / Resale value at horizon end
  residualValueEstimate: number; // expected resale or trade-in value recovery
  residualConfidence: ConfidenceLevel;
  residualSource?: SourceReference;

  // Audit metadata
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonProject {
  id: string;
  title: string;
  description?: string;
  category: ProductCategory;
  currency: string;
  horizonYears: number; // 1, 3, 5, 10
  discountRatePct: number; // e.g. 0% or 4.5% annual discount rate for NPV
  scenario: ScenarioType;
  options: ComparisonOption[];
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCashflowPoint {
  month: number;
  dateLabel: string;
  optionCosts: Record<string, {
    monthlyExpense: number;
    cumulativeTotal: number;
    breakdown: {
      recurring: number;
      maintenance: number;
      operating: number;
      replacement: number;
    };
  }>;
}

export interface OptionCalculationResult {
  optionId: string;
  optionName: string;
  currency: string;
  horizonYears: number;
  scenario: ScenarioType;

  // Disaggregated totals
  initialAcquisitionTotal: number;
  setupAccessoriesTotal: number;
  recurringTotal: number;
  maintenanceTotal: number;
  operatingTotal: number;
  replacementTotal: number;
  replacementsOccurred: number;
  residualRecoveryTotal: number;

  // Bottom-line figures
  grossTotalCost: number;
  netTotalCost: number;
  monthlyEquivalentCost: number;
  annualEquivalentCost: number;
  presentValueNetTotal: number; // with discount rate

  // Cumulative timeline series (month 0 to month N)
  timeline: {
    month: number;
    cumulativeCost: number;
    periodicExpense: number;
  }[];

  // Audit summary
  confidenceBreakdown: {
    confirmedTotal: number;
    userEstimateTotal: number;
    externalSourceTotal: number;
    suggestedUnverifiedTotal: number;
    missingCount: number;
  };
}

export interface ComparisonAnalysisResult {
  projectTitle: string;
  horizonYears: number;
  scenario: ScenarioType;
  currency: string;
  discountRatePct: number;
  results: Record<string, OptionCalculationResult>;
  lowestCostOptionId: string;
  highestCostOptionId: string;
  netSavings: number;
  percentageSavings: number;
  keyDrivers: {
    title: string;
    description: string;
    impactAmount: number;
    favorableToOptionId: string;
  }[];
  monthlyCashflows: MonthlyCashflowPoint[];
}

export interface AiReviewResponse {
  executiveSummary: string;
  lowestCostExplanation: string;
  driverBreakdown: {
    factor: string;
    description: string;
    recommendation: string;
  }[];
  missingAssumptionsFlags: string[];
  hiddenCostSuggestions: {
    category: string;
    costName: string;
    typicalRange: string;
    rational: string;
  }[];
  scenarioSensitivityNotes: string;
  strategicTradeoffs: string;
  disclaimer: string;
  isMock: boolean;
  modelUsed: string;
  timestamp: string;
}
