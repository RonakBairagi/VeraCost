import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class TataCliqAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'tatacliq';
  readonly name: string = 'Tata CLiQ';
  readonly logoText: string = 'Tata CLiQ';
  readonly brandColor: string = '#7c3aed';
  readonly documentationUrl: string = 'https://www.tatacliq.com';

  constructor() {
    super('TATACLIQ_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`;
  }
}
