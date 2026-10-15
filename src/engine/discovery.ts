/**
 * Rules-Based Cost Discovery Engine
 *
 * Provides category-specific checklists for commonly overlooked or hidden costs
 * such as accessories, maintenance, consumable wear, warranties, and operating utilities.
 */

import { BillingFrequency, CostItem, ProductCategory } from '../types/cost';

export interface DiscoverySuggestion {
  id: string;
  name: string;
  category: 'setup' | 'recurring' | 'maintenance' | 'operating' | 'replacement';
  frequency: BillingFrequency;
  defaultAmount: number;
  description: string;
  relevance: string;
  typicalRange: string;
  applicableProductCategories: ProductCategory[];
}

export const DISCOVERY_CATALOG: DiscoverySuggestion[] = [
  // --- Electronics & Computing ---
  {
    id: 'disc-elec-dock',
    name: 'Dongles, Adapters & Hubs',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 79,
    description: 'Multi-port USB-C hubs, video adapters, and ergonomic desk risers.',
    relevance: 'Essential for modern ultrabooks lacking legacy HDMI or USB-A ports.',
    typicalRange: '$30 – $150',
    applicableProductCategories: ['electronics'],
  },
  {
    id: 'disc-elec-warranty',
    name: 'Extended Hardware Protection (e.g. AppleCare+)',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 11.99,
    description: 'Accidental damage coverage and priority technical support.',
    relevance: 'Out-of-warranty screen or logic board repairs often exceed 50% of original value.',
    typicalRange: '$8 – $18 / mo',
    applicableProductCategories: ['electronics'],
  },
  {
    id: 'disc-elec-battery',
    name: 'Mid-Cycle Battery Replacement',
    category: 'maintenance',
    frequency: 'one-time',
    defaultAmount: 199,
    description: 'Lithium-ion cells typically degrade to <80% capacity after 24–36 months.',
    relevance: 'Required if planning to use device past 30 months without significant tethering.',
    typicalRange: '$120 – $250',
    applicableProductCategories: ['electronics'],
  },
  {
    id: 'disc-elec-cloud',
    name: 'Cloud Backup & Sync Storage',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 9.99,
    description: 'Offsite automated backup (Google One, iCloud, OneDrive, Backblaze).',
    relevance: 'Vital protection against catastrophic hardware failure, theft, or data loss.',
    typicalRange: '$3 – $15 / mo',
    applicableProductCategories: ['electronics', 'cloud-software'],
  },
  {
    id: 'disc-elec-software',
    name: 'Office & Creative Software Subscriptions',
    category: 'recurring',
    frequency: 'annual',
    defaultAmount: 99,
    description: 'Productivity suites (Microsoft 365, Adobe Creative Cloud, specialized IDEs).',
    relevance: 'Frequently needed to make hardware functional for work or school.',
    typicalRange: '$70 – $600 / yr',
    applicableProductCategories: ['electronics', 'cloud-software'],
  },
  {
    id: 'disc-elec-power',
    name: 'Electricity Consumption & Charging',
    category: 'operating',
    frequency: 'annual',
    defaultAmount: 28,
    description: 'Active power draw during daily high-load rendering or charging cycles.',
    relevance: 'High-TDP workstations can consume $80–$150/year in continuous compute.',
    typicalRange: '$20 – $120 / yr',
    applicableProductCategories: ['electronics'],
  },

  // --- Household Appliances ---
  {
    id: 'disc-app-install',
    name: 'Professional Delivery & Installation / Unhook',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 150,
    description: 'Plumbing hookups, gas fitting, leveling, and hauling away old appliance.',
    relevance: 'Usually required to validate warranty coverage on heavy appliances.',
    typicalRange: '$100 – $250',
    applicableProductCategories: ['appliances'],
  },
  {
    id: 'disc-app-energy',
    name: 'Energy Star Utility Consumption (kWh / Water)',
    category: 'operating',
    frequency: 'annual',
    defaultAmount: 85,
    description: 'Annual electrical and water utility charges based on average usage cycles.',
    relevance: 'Differences in energy rating can swing total 10-year cost by over $600.',
    typicalRange: '$40 – $180 / yr',
    applicableProductCategories: ['appliances'],
  },
  {
    id: 'disc-app-consumables',
    name: 'Replacement Water Filters & Descalers',
    category: 'operating',
    frequency: 'annual',
    defaultAmount: 95,
    description: 'Periodic carbon block filters, mineral descaling tablets, or air fresheners.',
    relevance: 'Required every 6 months to prevent pump failure and maintain sanitation.',
    typicalRange: '$50 – $140 / yr',
    applicableProductCategories: ['appliances'],
  },
  {
    id: 'disc-app-wear',
    name: 'Gasket & Heating Element Servicing',
    category: 'maintenance',
    frequency: 'one-time',
    defaultAmount: 180,
    description: 'Rubber door seals, thermal fuses, and heating coil replacements around year 4.',
    relevance: 'Common failure points before full appliance obsolescence.',
    typicalRange: '$120 – $300',
    applicableProductCategories: ['appliances'],
  },

  // --- Vehicles & Mobility ---
  {
    id: 'disc-veh-insurance',
    name: 'Auto Comprehensive & Collision Insurance',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 165,
    description: 'Coverage variance based on vehicle safety rating, repairability, and theft stats.',
    relevance: 'Certain performance or EV models carry 25–40% higher insurance premiums.',
    typicalRange: '$110 – $280 / mo',
    applicableProductCategories: ['vehicles'],
  },
  {
    id: 'disc-veh-tires',
    name: 'Tire Replacement & Seasonal Swaps',
    category: 'maintenance',
    frequency: 'annual',
    defaultAmount: 350,
    description: 'Set of all-season or winter tires replaced every 35,000–45,000 miles.',
    relevance: 'Heavy electric vehicles wear out torque-rated tires 20–30% faster.',
    typicalRange: '$250 – $500 / yr amortized',
    applicableProductCategories: ['vehicles'],
  },
  {
    id: 'disc-veh-fuel',
    name: 'Fuel / Supercharging & Home Charging',
    category: 'operating',
    frequency: 'monthly',
    defaultAmount: 140,
    description: 'Gasoline at 12,000 miles/yr or residential electricity rates per kWh.',
    relevance: 'Usually the single largest operational cost over a 5-year ownership period.',
    typicalRange: '$60 – $260 / mo',
    applicableProductCategories: ['vehicles'],
  },
  {
    id: 'disc-veh-registration',
    name: 'Annual Vehicle Registration & Road Tax',
    category: 'recurring',
    frequency: 'annual',
    defaultAmount: 220,
    description: 'State DMV registration, emissions testing, or highway road maintenance fees.',
    relevance: 'Varies dramatically by vehicle weight class and local jurisdiction.',
    typicalRange: '$80 – $450 / yr',
    applicableProductCategories: ['vehicles'],
  },

  // --- Cloud Software & SaaS ---
  {
    id: 'disc-saas-seats',
    name: 'Tier Upgrades & User License Growth',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 45,
    description: 'Additional team seats or tier upgrades as usage thresholds are met.',
    relevance: 'Base price tier frequently excludes necessary SSO, audit logs, or role permissions.',
    typicalRange: '$20 – $150 / mo',
    applicableProductCategories: ['cloud-software'],
  },
  {
    id: 'disc-saas-egress',
    name: 'API Egress & Over-Quota Bandwidth',
    category: 'operating',
    frequency: 'monthly',
    defaultAmount: 35,
    description: 'Data transfer fees, webhook volumes, and compute burst overages.',
    relevance: 'Uncapped cloud usage can lead to surprising bill shocks under load spikes.',
    typicalRange: '$15 – $200 / mo',
    applicableProductCategories: ['cloud-software'],
  },
  {
    id: 'disc-saas-onboarding',
    name: 'Implementation & Configuration Consulting',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 500,
    description: 'Initial data migration, Zapier/webhook pipeline setup, and staff onboarding.',
    relevance: 'Hidden labor and consulting overhead required to reach operational readiness.',
    typicalRange: '$200 – $2,000',
    applicableProductCategories: ['cloud-software'],
  },

  // --- Smartphones & Mobile Devices ---
  {
    id: 'disc-phone-charger',
    name: 'USB-C Fast Charger Brick & Braided Cable',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 39,
    description: 'High-wattage (30W-65W) power adapter no longer included in smartphone retail boxes.',
    relevance: 'Required for fast charging modern iPhones, Samsung Galaxy, and Pixel devices.',
    typicalRange: '$20 – $55',
    applicableProductCategories: ['smartphones', 'electronics', 'custom'],
  },
  {
    id: 'disc-phone-protection',
    name: 'Drop-Proof Case & Tempered Glass Screen Protector',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 49,
    description: 'Military-grade shock protection and oleophobic anti-scratch glass shield.',
    relevance: 'Modern glass-backed smartphones cost $200–$400 for back/front panel repair without protection.',
    typicalRange: '$25 – $80',
    applicableProductCategories: ['smartphones', 'custom'],
  },
  {
    id: 'disc-phone-insurance',
    name: 'Smartphone Protection Plan (AppleCare+ / Samsung Care+)',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 11.49,
    description: 'Accidental damage repair coverage, battery replacement, and theft/loss protection.',
    relevance: 'Crucial for flagship phones valued over $900 with high OLED display replacement costs.',
    typicalRange: '$8 – $16 / mo',
    applicableProductCategories: ['smartphones', 'electronics'],
  },
  {
    id: 'disc-phone-plan',
    name: '5G Mobile Carrier Data Plan & SIM Service',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 55,
    description: 'Unlimited 5G connectivity, hotspot data, and mobile carrier line access.',
    relevance: 'Over 2–3 years, carrier service fees ($1,300–$2,200) easily exceed the purchase price of the phone.',
    typicalRange: '$35 – $85 / mo',
    applicableProductCategories: ['smartphones'],
  },
  {
    id: 'disc-phone-battery',
    name: '24-Month Lithium Battery Service',
    category: 'maintenance',
    frequency: 'one-time',
    defaultAmount: 99,
    description: 'Official OEM battery replacement when maximum capacity degrades below 80%.',
    relevance: 'Extends useful smartphone life from 2 years to 4+ years with original performance.',
    typicalRange: '$70 – $120',
    applicableProductCategories: ['smartphones'],
  },
  {
    id: 'disc-phone-cloud',
    name: 'Mobile Photo & Video Cloud Storage (iCloud / Google One)',
    category: 'recurring',
    frequency: 'monthly',
    defaultAmount: 2.99,
    description: '200GB cloud storage tier for full-resolution camera roll backup and WhatsApp sync.',
    relevance: 'Necessary when opting for base smartphone storage tiers (128GB/256GB).',
    typicalRange: '$1.99 – $9.99 / mo',
    applicableProductCategories: ['smartphones', 'cloud-software'],
  },

  // --- Audio, Wearables & Tech ---
  {
    id: 'disc-wear-case',
    name: 'Earbuds Protective Silicone Case & Cleaning Kit',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 25,
    description: 'Anti-scratch silicone charging case sleeve, carabiner, and acoustic putty brush.',
    relevance: 'Prevents wireless charging case scuffs and micro-lint acoustic grill blockages.',
    typicalRange: '$15 – $40',
    applicableProductCategories: ['audio-wearables', 'electronics'],
  },
  {
    id: 'disc-wear-eartips',
    name: 'Replacement Memory Foam / Silicone Ear Tips',
    category: 'operating',
    frequency: 'annual',
    defaultAmount: 18,
    description: 'Comfort memory foam tips and acoustic mesh seals that degrade with ear canal oils.',
    relevance: 'Restores active noise cancellation (ANC) seal and bass response.',
    typicalRange: '$12 – $30 / yr',
    applicableProductCategories: ['audio-wearables'],
  },

  // --- Gaming & Consoles ---
  {
    id: 'disc-game-controller',
    name: 'Secondary Wireless Controller',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 69,
    description: 'Official gamepad for local co-op multiplayer and backup rotation.',
    relevance: 'Standard retail packages include only a single controller.',
    typicalRange: '$50 – $80',
    applicableProductCategories: ['gaming'],
  },
  {
    id: 'disc-game-sub',
    name: 'Online Gaming Network (Game Pass / PS Plus)',
    category: 'recurring',
    frequency: 'annual',
    defaultAmount: 119,
    description: 'Multiplayer cloud network access, monthly game catalog, and cloud saves.',
    relevance: 'Mandatory to play online multiplayer titles on modern consoles.',
    typicalRange: '$60 – $180 / yr',
    applicableProductCategories: ['gaming'],
  },
  {
    id: 'disc-game-storage',
    name: 'High-Speed NVMe Storage Expansion',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 110,
    description: '1TB-2TB M.2 PCIe Gen4 NVMe SSD with heatsink for modern 100GB+ game titles.',
    relevance: 'Factory internal storage usually fills up within 4–6 installed AAA games.',
    typicalRange: '$80 – $180',
    applicableProductCategories: ['gaming'],
  },

  // --- General & Custom Internet Purchases ---
  {
    id: 'disc-gen-shipping',
    name: 'Freight Delivery, Customs & Import Duties',
    category: 'setup',
    frequency: 'one-time',
    defaultAmount: 45,
    description: 'Cross-border shipping tariffs, handling, and parcel insurance.',
    relevance: 'Often omitted until the final checkout or customs invoice.',
    typicalRange: '$15 – $150',
    applicableProductCategories: ['other', 'custom', 'home-garden', 'electronics'],
  },
  {
    id: 'disc-gen-warranty',
    name: 'Commercial Extended Warranty Protection',
    category: 'recurring',
    frequency: 'annual',
    defaultAmount: 65,
    description: 'Extended coverage covering mechanical breakdown after standard 1-year warranty.',
    relevance: 'Protects investment against unexpected post-warranty component failure.',
    typicalRange: '$30 – $150 / yr',
    applicableProductCategories: ['custom', 'other'],
  },
  {
    id: 'disc-gen-consumables',
    name: 'Periodic Consumables & Operational Supplies',
    category: 'operating',
    frequency: 'annual',
    defaultAmount: 80,
    description: 'Refills, cleaning solvents, filters, wear pads, or proprietary supplies.',
    relevance: 'Ongoing physical items required to keep the product operating.',
    typicalRange: '$30 – $250 / yr',
    applicableProductCategories: ['custom', 'other'],
  },
  {
    id: 'disc-gen-disposal',
    name: 'End-of-Life Decommissioning & Recycling Fee',
    category: 'replacement',
    frequency: 'one-time',
    defaultAmount: 40,
    description: 'Hazardous materials disposal, certified recycling, or municipal bulky haul away.',
    relevance: 'Mandatory in several jurisdictions for heavy electronics and refrigerants.',
    typicalRange: '$20 – $90',
    applicableProductCategories: ['other', 'custom', 'electronics', 'appliances'],
  },
];

/**
 * Filter discovery suggestions suitable for a specific product category
 */
export function getSuggestionsForCategory(category: ProductCategory): DiscoverySuggestion[] {
  return DISCOVERY_CATALOG.filter(item => 
    item.applicableProductCategories.includes(category) || 
    item.applicableProductCategories.includes('custom') ||
    item.applicableProductCategories.includes('other')
  );
}

/**
 * Converts a DiscoverySuggestion into a concrete CostItem for a comparison option
 */
export function createCostItemFromSuggestion(suggestion: DiscoverySuggestion): CostItem {
  return {
    id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: suggestion.name,
    category: suggestion.category,
    amount: suggestion.defaultAmount,
    frequency: suggestion.frequency,
    confidence: 'suggested-unverified',
    notes: `${suggestion.relevance} (Typical range: ${suggestion.typicalRange})`,
    isUnknown: false,
  };
}
