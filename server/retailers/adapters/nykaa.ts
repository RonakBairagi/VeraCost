import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class NykaaAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'nykaa';
  readonly name: string = 'Nykaa';
  readonly logoText: string = 'Nykaa';
  readonly brandColor: string = '#fc2779';
  readonly documentationUrl: string = 'https://www.nykaa.com';

  constructor() {
    super('NYKAA_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`;
  }
}
