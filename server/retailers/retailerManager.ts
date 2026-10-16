import { IRetailerAdapter, RetailerSearchQuery } from './types';
import { AmazonIndiaAdapter } from './adapters/amazonIndia';
import { FlipkartAdapter } from './adapters/flipkart';
import { CromaAdapter } from './adapters/croma';
import { RelianceDigitalAdapter } from './adapters/relianceDigital';
import { VijaySalesAdapter } from './adapters/vijaySales';
import { TataCliqAdapter } from './adapters/tataCliq';
import { MyntraAdapter } from './adapters/myntra';
import { NykaaAdapter } from './adapters/nykaa';
import { OfficialStoreAdapter } from './adapters/officialStore';
import { SearchedProduct, RetailerListing, RetailerIntegrationStatus, RetailerId } from '../../src/types/shopping';
import { VERIFIED_INDIAN_CATALOG } from './verifiedCatalog';

export class RetailerManager {
  private adapters: Map<RetailerId, IRetailerAdapter> = new Map();

  constructor() {
    this.registerAdapter(new AmazonIndiaAdapter());
    this.registerAdapter(new FlipkartAdapter());
    this.registerAdapter(new CromaAdapter());
    this.registerAdapter(new RelianceDigitalAdapter());
    this.registerAdapter(new VijaySalesAdapter());
    this.registerAdapter(new TataCliqAdapter());
    this.registerAdapter(new MyntraAdapter());
    this.registerAdapter(new NykaaAdapter());
    this.registerAdapter(new OfficialStoreAdapter());
  }

  registerAdapter(adapter: IRetailerAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id: RetailerId): IRetailerAdapter | undefined {
    return this.adapters.get(id);
  }

  getAllAdapters(): IRetailerAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAllIntegrationStatuses(): RetailerIntegrationStatus[] {
    return this.getAllAdapters().map((adapter) => adapter.getIntegrationStatus());
  }

  async searchProduct(searchQuery: RetailerSearchQuery, targetRetailers?: RetailerId[]): Promise<SearchedProduct> {
    const rawQuery = (searchQuery.query || '').trim();
    if (!rawQuery && !searchQuery.barcode) {
      throw new Error('Search query or barcode is required.');
    }

    // Determine adapters to run
    const activeAdapters = this.getAllAdapters().filter((adapter) => {
      if (!targetRetailers || targetRetailers.length === 0) return true;
      return targetRetailers.includes(adapter.id);
    });

    // Execute queries in parallel with Promise.allSettled and timeout
    const results = await Promise.allSettled(
      activeAdapters.map(async (adapter) => {
        return adapter.search(searchQuery);
      })
    );

    const allListings: RetailerListing[] = [];

    results.forEach((res, index) => {
      const adapter = activeAdapters[index];
      if (res.status === 'fulfilled') {
        allListings.push(...res.value.listings);
      } else {
        // Individual adapter threw an error: isolate failure so other retailers survive!
        allListings.push({
          id: `fail-${adapter.id}-${Date.now()}`,
          retailerId: adapter.id,
          retailerName: adapter.name,
          retailerLogo: adapter.logoText,
          retailerColor: adapter.brandColor,
          productTitle: `${rawQuery} on ${adapter.name}`,
          brand: searchQuery.brand || '',
          model: searchQuery.model || rawQuery,
          listedPrice: 0,
          currency: 'INR',
          deliveryCharge: 0,
          mandatoryFees: 0,
          applicableDiscount: 0,
          estimatedCheckoutCost: 0,
          stockStatus: 'unknown',
          searchFallbackUrl: adapter.buildSearchFallbackUrl(rawQuery),
          source: `${adapter.name} Search Gateway`,
          status: 'unable_to_verify',
          priceType: 'unavailable',
          matchConfidence: 0,
          lastVerifiedTimestamp: new Date().toISOString(),
          statusMessage: `We couldn't verify ${adapter.name} availability right now. Try again later or open the retailer's search page.`,
        });
      }
    });

    // Rank verified listings: valid priced items first, sorted by estimated checkout cost
    const validPurchasable = allListings.filter(
      (l) => (l.status === 'exact_match' || l.status === 'possible_match') && l.listedPrice > 0 && l.stockStatus !== 'out_of_stock'
    );

    validPurchasable.sort((a, b) => a.estimatedCheckoutCost - b.estimatedCheckoutCost);

    const unranked = allListings.filter((l) => !validPurchasable.includes(l));
    const sortedListings = [...validPurchasable, ...unranked];

    // Compute best offer
    const bestOffer = validPurchasable.length > 0 ? validPurchasable[0] : undefined;

    // Price range calculation
    const prices = validPurchasable.map((l) => l.estimatedCheckoutCost).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Check if catalog has extra metadata, image, price history, alternatives
    const normalizedQuery = rawQuery.toLowerCase();
    const catalogMatch = VERIFIED_INDIAN_CATALOG.find(
      (p) =>
        (searchQuery.barcode && p.barcode === searchQuery.barcode) ||
        p.aliases.some((alias) => normalizedQuery.includes(alias) || alias.includes(normalizedQuery)) ||
        normalizedQuery.includes(p.model.toLowerCase()) ||
        normalizedQuery.includes(p.name.toLowerCase())
    );

    const productName = catalogMatch?.name || searchQuery.query;
    const brand = catalogMatch?.brand || searchQuery.brand || 'Verified Retail Product';
    const model = catalogMatch?.model || searchQuery.model || searchQuery.query;
    const category = catalogMatch?.category || searchQuery.category || 'electronics';
    const variant = catalogMatch?.variant || searchQuery.variant;
    const image = catalogMatch?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    const priceHistory = catalogMatch?.priceHistory || [];
    const alternatives = catalogMatch?.alternatives || [];

    return {
      id: `prod-${catalogMatch?.id || Date.now()}`,
      name: productName,
      brand,
      model,
      category,
      variant,
      image,
      barcode: searchQuery.barcode || catalogMatch?.barcode,
      listings: sortedListings,
      bestOffer,
      priceRange: { min: minPrice, max: maxPrice },
      priceHistory,
      alternatives,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const retailerManager = new RetailerManager();
