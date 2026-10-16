import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class OfficialStoreAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'official-store';
  readonly name: string = 'Official Brand Store';
  readonly logoText: string = 'Official Store';
  readonly brandColor: string = '#111827';
  readonly documentationUrl: string = 'https://www.apple.com/in/shop | https://www.samsung.com/in';

  constructor() {
    super('OFFICIAL_STORE_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    const qLower = query.toLowerCase();
    if (qLower.includes('apple') || qLower.includes('iphone') || qLower.includes('macbook')) {
      return `https://www.apple.com/in/search/${encodeURIComponent(query)}?src=globalnav`;
    }
    if (qLower.includes('samsung') || qLower.includes('galaxy')) {
      return `https://www.samsung.com/in/search/?searchvalue=${encodeURIComponent(query)}`;
    }
    if (qLower.includes('sony') || qLower.includes('playstation') || qLower.includes('ps5')) {
      return `https://shopatsc.com/search?q=${encodeURIComponent(query)}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(query + ' official india store')}`;
  }
}
