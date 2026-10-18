import { IRetailerAdapter, RetailerSearchQuery, RetailerAdapterResult } from './types';
import { RetailerId, RetailerListing, RetailerIntegrationStatus } from '../../src/types/shopping';
import { VERIFIED_INDIAN_CATALOG } from './verifiedCatalog';

/**
 * Cleans product search queries for reliable merchant portal URL generation.
 * Strips parentheses, quotes, and punctuation that cause Amazon & Flipkart search syntax errors.
 */
export function cleanRetailerSearchQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*\)/g, ' ')   // removes (128 GB), (Space Grey), etc.
    .replace(/\s*\[[^\]]*\]/g, ' ')   // removes [12 GB RAM], etc.
    .replace(/["'“”]/g, '')           // removes double/single quotes
    .replace(/[\\/\[\]{}|^~]/g, ' ')  // removes syntax operators
    .replace(/\s+/g, ' ')             // collapses extra whitespace
    .trim();
}

export abstract class BaseRetailerAdapter implements IRetailerAdapter {
  abstract readonly id: RetailerId;
  abstract readonly name: string;
  abstract readonly logoText: string;
  abstract readonly brandColor: string;
  abstract readonly documentationUrl: string;
  readonly requiredEnvVar?: string;
  protected timeoutMs: number = 4000;

  constructor(requiredEnvVar?: string) {
    this.requiredEnvVar = requiredEnvVar;
  }

  isConfigured(): boolean {
    if (!this.requiredEnvVar) return false;
    const val = process.env[this.requiredEnvVar];
    return Boolean(val && val.trim() !== '' && !val.includes('your_') && !val.includes('placeholder'));
  }

  getIntegrationStatus(): RetailerIntegrationStatus {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      isConfigured: configured,
      status: configured ? 'active' : 'search_fallback_only',
      authType: this.requiredEnvVar ? 'api_key' : 'direct_search',
      requiredEnvVar: this.requiredEnvVar,
      documentationUrl: this.documentationUrl,
      notes: configured
        ? `Configured via process.env.${this.requiredEnvVar}`
        : `Direct API credentials (${this.requiredEnvVar || 'API Key'}) not detected in environment. Using official authenticated search fallback links.`,
    };
  }

  abstract buildSearchFallbackUrl(query: string): string;

  protected calculateCheckoutCost(listing: Omit<RetailerListing, 'estimatedCheckoutCost'>): number {
    const base = Number(listing.listedPrice) || 0;
    const delivery = Number(listing.deliveryCharge) || 0;
    const fees = Number(listing.mandatoryFees) || 0;
    const discount = Number(listing.applicableDiscount) || 0;
    return Math.max(0, base + delivery + fees - discount);
  }

  protected findInVerifiedCatalog(query: RetailerSearchQuery): RetailerListing | null {
    const normalizedQuery = (query.query || '').toLowerCase().trim();
    const barcodeQuery = (query.barcode || '').trim();

    for (const prod of VERIFIED_INDIAN_CATALOG) {
      const matchBarcode = barcodeQuery && prod.barcode && prod.barcode === barcodeQuery;
      const matchAlias = prod.aliases.some((alias) => normalizedQuery.includes(alias) || alias.includes(normalizedQuery));
      const matchName = normalizedQuery.includes(prod.model.toLowerCase()) || normalizedQuery.includes(prod.name.toLowerCase());

      if (matchBarcode || matchAlias || matchName) {
        const matchingOffer = prod.offers.find((offer) => offer.retailerId === this.id);
        if (matchingOffer) {
          const estimatedCheckoutCost = this.calculateCheckoutCost(matchingOffer);
          return {
            ...matchingOffer,
            estimatedCheckoutCost,
          };
        }
      }
    }

    return null;
  }

  async search(query: RetailerSearchQuery): Promise<RetailerAdapterResult> {
    const startTime = Date.now();

    try {
      // 1. Check verified catalog first
      const catalogOffer = this.findInVerifiedCatalog(query);
      if (catalogOffer) {
        return {
          retailerId: this.id,
          retailerName: this.name,
          listings: [catalogOffer],
          isConfigured: this.isConfigured(),
          executionTimeMs: Date.now() - startTime,
        };
      }

      // 2. If provider API is configured, invoke live provider query
      if (this.isConfigured()) {
        const liveResult = await this.queryLiveApi(query);
        if (liveResult && liveResult.length > 0) {
          return {
            retailerId: this.id,
            retailerName: this.name,
            listings: liveResult,
            isConfigured: true,
            executionTimeMs: Date.now() - startTime,
          };
        }
      }

      // 3. Graceful fallback when unconfigured or no exact live API response
      const fallbackUrl = this.buildSearchFallbackUrl(query.query);
      const fallbackListing: RetailerListing = {
        id: `fallback-${this.id}-${Date.now()}`,
        retailerId: this.id,
        retailerName: this.name,
        retailerLogo: this.logoText,
        retailerColor: this.brandColor,
        productTitle: `${query.query} on ${this.name}`,
        brand: query.brand || 'Various',
        model: query.model || query.query,
        variant: query.variant,
        listedPrice: 0,
        currency: 'INR',
        deliveryCharge: 0,
        mandatoryFees: 0,
        applicableDiscount: 0,
        estimatedCheckoutCost: 0,
        stockStatus: 'unknown',
        searchFallbackUrl: fallbackUrl,
        source: `${this.name} Direct Search Link`,
        status: this.isConfigured() ? 'no_match' : 'not_configured',
        priceType: 'unavailable',
        matchConfidence: 50,
        lastVerifiedTimestamp: new Date().toISOString(),
        statusMessage: this.isConfigured()
          ? `No verified exact listing found on ${this.name}. Click search link to check current retailer listings.`
          : `Live ${this.name} API requires credentials. Click official search link to check live store inventory.`,
      };

      return {
        retailerId: this.id,
        retailerName: this.name,
        listings: [fallbackListing],
        isConfigured: this.isConfigured(),
        statusMessage: fallbackListing.statusMessage,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        retailerId: this.id,
        retailerName: this.name,
        listings: [
          {
            id: `err-${this.id}-${Date.now()}`,
            retailerId: this.id,
            retailerName: this.name,
            retailerLogo: this.logoText,
            retailerColor: this.brandColor,
            productTitle: `${query.query} on ${this.name}`,
            brand: query.brand || '',
            model: query.model || '',
            listedPrice: 0,
            currency: 'INR',
            deliveryCharge: 0,
            mandatoryFees: 0,
            applicableDiscount: 0,
            estimatedCheckoutCost: 0,
            stockStatus: 'unknown',
            searchFallbackUrl: this.buildSearchFallbackUrl(query.query),
            source: `${this.name} Search Gateway`,
            status: 'unable_to_verify',
            priceType: 'unavailable',
            matchConfidence: 0,
            lastVerifiedTimestamp: new Date().toISOString(),
            statusMessage: `We couldn't verify ${this.name} availability right now: ${err.message || 'Timeout/Network issue'}. Try again or open the retailer's search page.`,
          },
        ],
        isConfigured: this.isConfigured(),
        statusMessage: err.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Subclasses can override this to query real live APIs when credentials exist
   */
  protected async queryLiveApi(query: RetailerSearchQuery): Promise<RetailerListing[] | null> {
    return null;
  }
}
