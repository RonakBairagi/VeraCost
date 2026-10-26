/**
 * Deterministic Currency Conversion and Formatting Service for VeraCost
 * 
 * Supports seamless conversions across INR, EUR, USD, GBP, CAD, AUD, and JPY
 * with mathematically accurate exchange rates, precision preservation, and proper locale formatting.
 */

import { BRAND_CONFIG, CurrencyConfig } from '../config/branding';
import { ComparisonProject, ComparisonOption, CostItem } from '../types/cost';

// Standard fallback rates pegged to USD base
export const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 84.0,
  CAD: 1.38,
  AUD: 1.52,
  JPY: 152.0,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
};

export const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  USD: 'en-US',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
};

/**
 * Returns the symbol for a given currency code
 */
export function getCurrencySymbol(code: string): string {
  if (!code) return '$';
  const upper = code.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || upper;
}

/**
 * Get conversion rate from one currency to another
 */
export function getExchangeRate(from: string, to: string): number {
  const fromCode = (from || 'USD').toUpperCase();
  const toCode = (to || 'USD').toUpperCase();

  if (fromCode === toCode) return 1.0;

  const fromRate = CURRENCY_RATES_TO_USD[fromCode] || 1.0;
  const toRate = CURRENCY_RATES_TO_USD[toCode] || 1.0;

  // Rate from base USD: 1 fromCurrency = (toRate / fromRate) toCurrency
  return toRate / fromRate;
}

/**
 * Converts a monetary amount from one currency to another with rounding rules
 */
export function convertCurrency(amount: number | undefined | null, from: string, to: string): number {
  if (amount === undefined || amount === null || amount === 0 || isNaN(amount) || !isFinite(amount)) return 0;
  const fromCode = (from || 'USD').toUpperCase();
  const toCode = (to || 'USD').toUpperCase();

  if (fromCode === toCode) return amount;

  const rate = getExchangeRate(fromCode, toCode);
  const converted = amount * rate;

  // For INR and JPY, avoid fractional paise/cents in broad displays
  if (toCode === 'INR' || toCode === 'JPY') {
    return Math.round(converted);
  }

  // For USD, EUR, GBP, keep clean 2 decimals or rounded if whole
  return Math.round(converted * 100) / 100;
}

/**
 * Formats a monetary number with proper locale and symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: {
    includeSymbol?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {}
): string {
  const code = (currencyCode || 'USD').toUpperCase();
  const symbol = getCurrencySymbol(code);
  const locale = CURRENCY_LOCALES[code] || 'en-US';
  const includeSymbol = options.includeSymbol !== false;

  const isIntCurrency = code === 'INR' || code === 'JPY';
  const maxDigits = options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : isIntCurrency ? 0 : 2;
  const minDigits = options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : isIntCurrency ? 0 : (amount % 1 === 0 ? 0 : 2);

  const numFormatted = amount.toLocaleString(locale, {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: minDigits,
  });

  if (!includeSymbol) return numFormatted;

  if (code === 'EUR') {
    // European standard formatting: €1.250 or 1.250 €
    return `€${numFormatted}`;
  }

  return `${symbol}${numFormatted}`;
}

/**
 * Converts an entire CostItem from one currency to another
 */
export function convertCostItem(item: CostItem, fromCurrency: string, toCurrency: string): CostItem {
  if (fromCurrency === toCurrency) return item;
  return {
    ...item,
    amount: convertCurrency(item.amount, fromCurrency, toCurrency),
  };
}

/**
 * Converts a ComparisonOption from one currency to another
 */
export function convertComparisonOption(
  option: ComparisonOption,
  fromCurrency: string,
  toCurrency: string
): ComparisonOption {
  if (fromCurrency === toCurrency) return { ...option, currency: toCurrency };

  const convertArray = (items?: CostItem[]) =>
    Array.isArray(items) ? items.map((i) => convertCostItem(i, fromCurrency, toCurrency)) : [];

  return {
    ...option,
    currency: toCurrency,
    initialPurchasePrice: convertCurrency(option.initialPurchasePrice, fromCurrency, toCurrency),
    salesTaxOrFees: convertCurrency(option.salesTaxOrFees, fromCurrency, toCurrency),
    setupAndAccessories: convertArray(option.setupAndAccessories),
    recurringCosts: convertArray(option.recurringCosts),
    maintenanceCosts: convertArray(option.maintenanceCosts),
    operatingCosts: convertArray(option.operatingCosts),
    replacementCostEstimate: option.replacementCostEstimate !== undefined
      ? convertCurrency(option.replacementCostEstimate, fromCurrency, toCurrency)
      : undefined,
    residualValueEstimate: convertCurrency(option.residualValueEstimate, fromCurrency, toCurrency),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Converts an entire ComparisonProject from its current currency to targetCurrency
 */
export function convertProjectCurrency(
  project: ComparisonProject,
  targetCurrency: string
): ComparisonProject {
  const fromCurrency = (project.currency || 'USD').toUpperCase();
  const toCurrency = (targetCurrency || 'USD').toUpperCase();

  if (fromCurrency === toCurrency) return project;

  return {
    ...project,
    currency: toCurrency,
    options: project.options.map((opt) => convertComparisonOption(opt, fromCurrency, toCurrency)),
    updatedAt: new Date().toISOString(),
  };
}
