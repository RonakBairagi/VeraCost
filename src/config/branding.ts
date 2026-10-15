/**
 * Central Brand and Application Configuration
 *
 * All branding, naming, currency defaults, and simulation settings are defined here.
 * The product name is never hardcoded across components.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  rateToUSD: number; // reference conversion multiplier
}

export const BRAND_CONFIG = {
  name: 'VeraCost',
  tagline: 'Transparent Total Cost Decision Platform',
  descriptor: 'Look beyond the sticker price. Simulate true ownership, repair, maintenance, and replacement costs over time.',
  version: '1.0.0',
  license: 'Apache-2.0',
  author: 'VeraCost Architecture & Engineering Team',
  hackathonNotice: 'Prepared for the NVIDIA & Nebius AI Token Factory Hackathon',
  aiProviderLabel: 'NVIDIA Nemotron via Nebius Token Factory',
  defaultModel: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
  supportedModels: [
    {
      id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
      name: 'NVIDIA Llama 3.1 Nemotron 70B Instruct',
      provider: 'Nebius Token Factory',
      description: 'Optimized for deep synthesis, financial reasoning, and structured tradeoffs',
    },
    {
      id: 'nvidia/nemotron-4-340b-instruct',
      name: 'NVIDIA Nemotron-4 340B Instruct',
      provider: 'Nebius Token Factory',
      description: 'Frontier 340B parameter model for complex multi-variable scenario auditing',
    },
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b',
      name: 'NVIDIA Nemotron 3 Ultra 550B',
      provider: 'Nebius Token Factory',
      description: 'Frontier hybrid MoE model for deep autonomous agent reasoning',
    },
  ],
  defaultCurrency: 'USD',
  currencies: [
    { code: 'USD', symbol: '$', label: 'USD ($)', rateToUSD: 1.0 },
    { code: 'EUR', symbol: '€', label: 'EUR (€)', rateToUSD: 0.92 },
    { code: 'GBP', symbol: '£', label: 'GBP (£)', rateToUSD: 0.79 },
    { code: 'CAD', symbol: 'CA$', label: 'CAD ($)', rateToUSD: 1.38 },
    { code: 'AUD', symbol: 'AU$', label: 'AUD ($)', rateToUSD: 1.52 },
    { code: 'INR', symbol: '₹', label: 'INR (₹)', rateToUSD: 84.0 },
    { code: 'JPY', symbol: '¥', label: 'JPY (¥)', rateToUSD: 152.0 },
  ] as CurrencyConfig[],
  defaultHorizonYears: 3,
  supportedHorizons: [
    { years: 1, label: '1 Year (Short Term)', months: 12 },
    { years: 3, label: '3 Years (Typical Lifecycle)', months: 36 },
    { years: 5, label: '5 Years (Extended Ownership)', months: 60 },
    { years: 10, label: '10 Years (Long Term Capital)', months: 120 },
  ],
  scenarios: [
    {
      id: 'typical',
      label: 'Typical Scenario',
      multiplier: 1.0,
      description: 'Expected average repair frequencies, standard operating consumption, and scheduled maintenance.',
    },
    {
      id: 'lower',
      label: 'Lower-Cost Scenario (Optimistic)',
      multiplier: 0.82,
      description: 'Flawless reliability, lower utility/consumable usage, zero accidental damage, and optimal resale value.',
    },
    {
      id: 'higher',
      label: 'Higher-Cost Scenario (Stress Test)',
      multiplier: 1.25,
      description: 'Battery replacements, out-of-warranty repairs, higher energy consumption, accessory replacements, lower resale.',
    },
  ],
};
