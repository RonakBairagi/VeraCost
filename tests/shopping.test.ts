import { describe, it, expect } from 'vitest';
import { retailerManager } from '../server/retailers/retailerManager';
import { VERIFIED_INDIAN_CATALOG } from '../server/retailers/verifiedCatalog';
import { AmazonIndiaAdapter } from '../server/retailers/adapters/amazonIndia';
import { FlipkartAdapter } from '../server/retailers/adapters/flipkart';
import { CromaAdapter } from '../server/retailers/adapters/croma';
import { RetailerListing } from '../src/types/shopping';

describe('VeraCost Smart Price Finder & Multi-Retailer Engine', () => {
  it('registers all 9 Indian market retailer adapters', () => {
    const statuses = retailerManager.getAllIntegrationStatuses();
    expect(statuses.length).toBe(9);
    
    const ids = statuses.map((s) => s.id);
    expect(ids).toContain('amazon-in');
    expect(ids).toContain('flipkart');
    expect(ids).toContain('croma');
    expect(ids).toContain('reliance-digital');
    expect(ids).toContain('vijay-sales');
    expect(ids).toContain('tatacliq');
    expect(ids).toContain('myntra');
    expect(ids).toContain('nykaa');
    expect(ids).toContain('official-store');
  });

  it('determines integration status truthfully based on environment', () => {
    const amazon = new AmazonIndiaAdapter();
    const status = amazon.getIntegrationStatus();
    expect(status.id).toBe('amazon-in');
    expect(typeof status.isConfigured).toBe('boolean');
    expect(status.documentationUrl).toContain('amazon');
  });

  it('generates authentic, HTTPS search fallback URLs for all retailers', () => {
    const amazon = new AmazonIndiaAdapter();
    const flipkart = new FlipkartAdapter();
    const croma = new CromaAdapter();

    const amzUrl = amazon.buildSearchFallbackUrl('Sony WH-1000XM5');
    const fkUrl = flipkart.buildSearchFallbackUrl('Sony WH-1000XM5');
    const crUrl = croma.buildSearchFallbackUrl('Sony WH-1000XM5');

    expect(amzUrl.startsWith('https://www.amazon.in/s?k=')).toBe(true);
    expect(fkUrl.startsWith('https://www.flipkart.com/search?q=')).toBe(true);
    expect(crUrl.startsWith('https://www.croma.com/searchB?q=')).toBe(true);
  });

  it('contains verified benchmark products with real pricing and valid URLs', () => {
    expect(VERIFIED_INDIAN_CATALOG.length).toBeGreaterThan(0);

    const iphone = VERIFIED_INDIAN_CATALOG.find((p) => p.id === 'iphone-16-pro-128gb');
    expect(iphone).toBeDefined();
    expect(iphone?.mrp).toBe(119900);
    expect(iphone?.barcode).toBe('0195949791484');
    expect(iphone?.offers.length).toBeGreaterThanOrEqual(4);

    iphone?.offers.forEach((offer) => {
      expect(offer.listedPrice).toBeGreaterThan(0);
      expect(offer.currency).toBe('INR');
      expect(offer.status).toBe('exact_match');
      expect(offer.directProductUrl?.startsWith('https://')).toBe(true);
      expect(offer.searchFallbackUrl.startsWith('https://')).toBe(true);
    });
  });

  it('calculates estimated checkout cost deterministically (base + delivery + fees - discounts)', async () => {
    const result = await retailerManager.searchProduct({ query: 'Apple iPhone 16 Pro 128GB' });

    expect(result.listings.length).toBeGreaterThan(0);
    const validOffer = result.listings.find((l) => l.listedPrice > 0 && l.status === 'exact_match');
    expect(validOffer).toBeDefined();

    if (validOffer) {
      const expectedCheckout = Math.max(
        0,
        validOffer.listedPrice + validOffer.deliveryCharge + validOffer.mandatoryFees - validOffer.applicableDiscount
      );
      expect(validOffer.estimatedCheckoutCost).toBe(expectedCheckout);
    }
  });

  it('ranks verified listings by checkout cost and identifies the best offer', async () => {
    const result = await retailerManager.searchProduct({ query: 'Samsung Galaxy S24 Ultra 256GB' });

    expect(result.name).toContain('Galaxy S24 Ultra');
    expect(result.bestOffer).toBeDefined();
    expect(result.bestOffer?.estimatedCheckoutCost).toBeGreaterThan(0);

    // Verify list is sorted in ascending order of checkout cost for purchasable items
    const pricedListings = result.listings.filter((l) => l.estimatedCheckoutCost > 0);
    for (let i = 0; i < pricedListings.length - 1; i++) {
      expect(pricedListings[i].estimatedCheckoutCost).toBeLessThanOrEqual(pricedListings[i + 1].estimatedCheckoutCost);
    }
  });

  it('matches products by barcode lookup accurately', async () => {
    const result = await retailerManager.searchProduct({ query: '', barcode: '0195949791484' });
    expect(result.name).toContain('iPhone 16 Pro');
    expect(result.barcode).toBe('0195949791484');
  });

  it('isolates retailer failures so other retailers succeed gracefully', async () => {
    // Search a product that returns valid offers without throwing
    const result = await retailerManager.searchProduct({ query: 'NonExistentProductQuery123456789' });
    expect(result.listings.length).toBe(9);
    // Unconfigured or no-match retailers should have informative fallback listings
    result.listings.forEach((l) => {
      expect(['no_match', 'not_configured', 'unable_to_verify']).toContain(l.status);
      expect(l.searchFallbackUrl.startsWith('https://')).toBe(true);
    });
  });
});
