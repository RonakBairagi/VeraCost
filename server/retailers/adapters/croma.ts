import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class CromaAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'croma';
  readonly name: string = 'Croma';
  readonly logoText: string = 'Croma';
  readonly brandColor: string = '#00b6b6';
  readonly documentationUrl: string = 'https://www.croma.com';

  constructor() {
    super('CROMA_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.croma.com/searchB?q=${encodeURIComponent(query)}`;
  }
}
