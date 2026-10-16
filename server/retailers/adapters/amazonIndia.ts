import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId, RetailerListing } from '../../../src/types/shopping';
import { RetailerSearchQuery } from '../types';

export class AmazonIndiaAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'amazon-in';
  readonly name: string = 'Amazon India';
  readonly logoText: string = 'Amazon';
  readonly brandColor: string = '#ff9900';
  readonly documentationUrl: string = 'https://webservices.amazon.in/paapi5/documentation/';

  constructor() {
    super('AMAZON_IN_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=veracost_price_finder`;
  }

  protected async queryLiveApi(query: RetailerSearchQuery): Promise<RetailerListing[] | null> {
    const rapidKey = process.env.RAPIDAPI_AMAZON_KEY;
    if (!rapidKey) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const resp = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query.query)}&country=IN`,
        {
          headers: {
            'x-rapidapi-key': rapidKey,
            'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!resp.ok) return null;

      const data = await resp.json();
      const items = data?.data?.products || [];
      if (items.length === 0) return null;

      const topItem = items[0];
      const rawPrice = topItem.product_price ? parseFloat(topItem.product_price.replace(/[^0-9.]/g, '')) : 0;
      if (!rawPrice) return null;

      const delivery = topItem.is_prime ? 0 : 40;
      const listing: RetailerListing = {
        id: `live-amazon-${topItem.asin || Date.now()}`,
        retailerId: this.id,
        retailerName: this.name,
        retailerLogo: this.logoText,
        retailerColor: this.brandColor,
        productTitle: topItem.product_title || `${query.query} on Amazon India`,
        brand: query.brand || 'Amazon Merchant',
        model: query.model || query.query,
        variant: query.variant,
        listedPrice: rawPrice,
        currency: 'INR',
        deliveryCharge: delivery,
        mandatoryFees: 49,
        applicableDiscount: 0,
        estimatedCheckoutCost: rawPrice + delivery + 49,
        stockStatus: topItem.is_out_of_stock ? 'out_of_stock' : 'in_stock',
        deliveryEstimate: topItem.delivery || '1-3 Business Days',
        warrantyInfo: 'Standard Manufacturer Warranty',
        returnPolicy: 'Amazon 7 Days Return/Replacement Policy',
        directProductUrl: topItem.product_url?.startsWith('https') ? topItem.product_url : this.buildSearchFallbackUrl(query.query),
        searchFallbackUrl: this.buildSearchFallbackUrl(query.query),
        source: 'Amazon India Live Product API',
        status: 'exact_match',
        priceType: 'live',
        matchConfidence: 92,
        lastVerifiedTimestamp: new Date().toISOString(),
        sellerRating: topItem.product_star_rating ? parseFloat(topItem.product_star_rating) : 4.5,
      };

      return [listing];
    } catch {
      return null;
    }
  }
}
