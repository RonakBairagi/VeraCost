import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  formatCurrency,
  getExchangeRate,
  getCurrencySymbol,
  convertProjectCurrency,
} from '../src/services/currencyConverter';
import { compressProfileImage, withTimeout } from '../src/config/firebase';
import { SAMPLE_COMPARISONS } from '../src/data/sampleComparisons';

describe('VeraCost Currency Conversion & Financial Accuracy', () => {
  it('correctly retrieves exchange rates pegged to base USD', () => {
    expect(getExchangeRate('USD', 'USD')).toBe(1.0);
    // 1 USD = 84 INR; 1 USD = 0.92 EUR
    const eurToInr = getExchangeRate('EUR', 'INR');
    expect(eurToInr).toBeCloseTo(84.0 / 0.92, 1);

    const inrToEur = getExchangeRate('INR', 'EUR');
    expect(inrToEur).toBeCloseTo(0.92 / 84.0, 3);
  });

  it('converts amounts between INR, EUR, and USD accurately without numeric equivalence bug', () => {
    // 84,000 INR should convert to approximately 920 EUR, NOT stay 84,000!
    const inrAmount = 84000;
    const eurConverted = convertCurrency(inrAmount, 'INR', 'EUR');
    expect(eurConverted).toBeCloseTo(920, -1);
    expect(eurConverted).not.toBe(inrAmount);

    // Converting 1000 EUR to USD
    const usdConverted = convertCurrency(1000, 'EUR', 'USD');
    expect(usdConverted).toBeCloseTo(1086.96, 1);

    // Identity conversion
    expect(convertCurrency(500, 'EUR', 'EUR')).toBe(500);
    expect(convertCurrency(0, 'INR', 'EUR')).toBe(0);
  });

  it('formats currencies with proper symbols and locale rules', () => {
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('GBP')).toBe('£');

    const formattedInr = formatCurrency(125000, 'INR');
    expect(formattedInr).toContain('₹');
    // Indian locale groups: 1,25,000
    expect(formattedInr).toContain('1,25,000');

    const formattedEur = formatCurrency(1250.5, 'EUR');
    expect(formattedEur).toContain('€');
  });

  it('converts entire comparison projects without compounding rounding errors', () => {
    const originalProject = SAMPLE_COMPARISONS[0];
    const originalCurrency = originalProject.currency; // e.g. USD or INR

    // Convert project to EUR
    const eurProject = convertProjectCurrency(originalProject, 'EUR');
    expect(eurProject.currency).toBe('EUR');
    expect(eurProject.options[0].currency).toBe('EUR');
    expect(eurProject.options[0].initialPurchasePrice).toBeGreaterThan(0);

    // Convert to INR
    const inrProject = convertProjectCurrency(eurProject, 'INR');
    expect(inrProject.currency).toBe('INR');
    expect(inrProject.options[0].currency).toBe('INR');

    // Convert back to original currency and compare tolerance
    const restoredProject = convertProjectCurrency(inrProject, originalCurrency);
    expect(restoredProject.currency).toBe(originalCurrency);
    expect(restoredProject.options[0].initialPurchasePrice).toBeCloseTo(
      originalProject.options[0].initialPurchasePrice,
      -1
    );
  });
});

describe('VeraCost Profile & Timeout Resilience', () => {
  it('rejects unsupported non-image file types in compressProfileImage', async () => {
    const fakeFile = new File(['hello world text'], 'document.pdf', { type: 'application/pdf' });
    await expect(compressProfileImage(fakeFile)).rejects.toThrow(/valid image file/);
  });

  it('rejects files larger than 5MB in compressProfileImage', async () => {
    // Create oversized file mock
    const largeFile = new File(['a'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    await expect(compressProfileImage(largeFile)).rejects.toThrow(/too large/);
  });

  it('withTimeout prevents hanging asynchronous operations', async () => {
    const hangingPromise = new Promise((resolve) => setTimeout(() => resolve('finished'), 2000));
    const result = await withTimeout(hangingPromise, 100, 'timed_out_fallback');
    expect(result).toBe('timed_out_fallback');
  });

  it('withTimeout returns normal value if promise resolves before timeout', async () => {
    const fastPromise = Promise.resolve('fast_result');
    const result = await withTimeout(fastPromise, 500, 'fallback');
    expect(result).toBe('fast_result');
  });
});
