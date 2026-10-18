import { describe, it, expect } from 'vitest';
import { retailerManager } from '../server/retailers/retailerManager';
import { VERIFIED_INDIAN_CATALOG } from '../server/retailers/verifiedCatalog';
import { AmazonIndiaAdapter } from '../server/retailers/adapters/amazonIndia';
import { FlipkartAdapter } from '../server/retailers/adapters/flipkart';
import { CromaAdapter } from '../server/retailers/adapters/croma';
import { RetailerListing } from '../src/types/shopping';
import { inferProductCategory, getSuggestionsForCategory } from '../src/engine/discovery';
import { cleanRetailerSearchQuery } from '../server/retailers/baseAdapter';

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

  it('generates clean, authentic HTTPS search fallback URLs for all retailers without bot-triggering parameters', () => {
    const amazon = new AmazonIndiaAdapter();
    const flipkart = new FlipkartAdapter();
    const croma = new CromaAdapter();

    const amzUrl = amazon.buildSearchFallbackUrl('Sony WH-1000XM5 (Wireless)');
    const fkUrl = flipkart.buildSearchFallbackUrl('Apple iPhone 16 Pro (128 GB)');
    const crUrl = croma.buildSearchFallbackUrl('MacBook Pro 14" M3');

    // Verify clean Amazon search URL without bot-triggering &ref= parameter
    expect(amzUrl.startsWith('https://www.amazon.in/s?k=')).toBe(true);
    expect(amzUrl).not.toContain('&ref=veracost_price_finder');
    expect(amzUrl).not.toContain('%28'); // Parentheses should be cleaned

    // Verify clean Flipkart search URL without session-crashing parameters
    expect(fkUrl.startsWith('https://www.flipkart.com/search?q=')).toBe(true);
    expect(fkUrl).not.toContain('otracker1=search');
    expect(fkUrl).not.toContain('%28'); // (128 GB) should be cleaned

    // Verify clean Croma URL
    expect(crUrl.startsWith('https://www.croma.com/searchB?q=')).toBe(true);
    expect(crUrl).not.toContain('%22'); // Quotes should be cleaned
  });

  it('sanitizes product search strings with cleanRetailerSearchQuery', () => {
    expect(cleanRetailerSearchQuery('Apple iPhone 16 Pro (128 GB)')).toBe('Apple iPhone 16 Pro');
    expect(cleanRetailerSearchQuery('Apple MacBook Pro 14" M3 (512 GB SSD)')).toBe('Apple MacBook Pro 14 M3');
    expect(cleanRetailerSearchQuery('Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB) [12 GB RAM]')).toBe('Samsung Galaxy S24 Ultra 5G');
  });

  it('infers correct ProductCategory from product name and brand', () => {
    expect(inferProductCategory('Apple iPhone 16 Pro')).toBe('smartphones');
    expect(inferProductCategory('Samsung Galaxy S24 Ultra')).toBe('smartphones');
    expect(inferProductCategory('Sony WH-1000XM5 Wireless Headphones')).toBe('audio-wearables');
    expect(inferProductCategory('AirPods Pro 2nd Gen')).toBe('audio-wearables');
    expect(inferProductCategory('PlayStation 5 Slim Console')).toBe('gaming');
    expect(inferProductCategory('Nintendo Switch OLED')).toBe('gaming');
    expect(inferProductCategory('LG 260L Double Door Refrigerator')).toBe('appliances');
    expect(inferProductCategory('IFB Front Load Washing Machine')).toBe('appliances');
    expect(inferProductCategory('Apple MacBook Pro 14')).toBe('electronics');
    expect(inferProductCategory('Ola S1 Pro Electric Scooter')).toBe('vehicles');
  });

  it('maps correct category accessories and does not assign laptop accessories to phones or audio', () => {
    const phoneSuggestions = getSuggestionsForCategory('smartphones');
    const phoneNames = phoneSuggestions.slice(0, 4).map((s) => s.name);
    // Should contain charger brick, case, screen protector, carrier plan
    expect(phoneNames.some((n) => n.includes('Charger') || n.includes('Case') || n.includes('Protection'))).toBe(true);
    expect(phoneNames).not.toContain('Dongles, Adapters & Hubs');

    const audioSuggestions = getSuggestionsForCategory('audio-wearables');
    const audioNames = audioSuggestions.slice(0, 4).map((s) => s.name);
    expect(audioNames.some((n) => n.includes('Case') || n.includes('Tips') || n.includes('Warranty'))).toBe(true);

    const gameSuggestions = getSuggestionsForCategory('gaming');
    const gameNames = gameSuggestions.slice(0, 4).map((s) => s.name);
    expect(gameNames.some((n) => n.includes('Controller') || n.includes('Game Pass') || n.includes('Storage'))).toBe(true);

    const appSuggestions = getSuggestionsForCategory('appliances');
    const appNames = appSuggestions.slice(0, 4).map((s) => s.name);
    expect(appNames.some((n) => n.includes('Installation') || n.includes('Utility') || n.includes('Filters'))).toBe(true);
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
