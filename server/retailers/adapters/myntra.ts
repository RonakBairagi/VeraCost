import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class MyntraAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'myntra';
  readonly name: string = 'Myntra';
  readonly logoText: string = 'Myntra';
  readonly brandColor: string = '#f13ab1';
  readonly documentationUrl: string = 'https://www.myntra.com';

  constructor() {
    super('MYNTRA_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.myntra.com/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`;
  }
}
