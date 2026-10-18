import { BaseRetailerAdapter, cleanRetailerSearchQuery } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class FlipkartAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'flipkart';
  readonly name: string = 'Flipkart';
  readonly logoText: string = 'Flipkart';
  readonly brandColor: string = '#2874f0';
  readonly documentationUrl: string = 'https://affiliate.flipkart.com/api-docs';

  constructor() {
    super('FLIPKART_AFFILIATE_TOKEN');
  }

  buildSearchFallbackUrl(query: string): string {
    const cleanQuery = cleanRetailerSearchQuery(query);
    return `https://www.flipkart.com/search?q=${encodeURIComponent(cleanQuery)}`;
  }
}
