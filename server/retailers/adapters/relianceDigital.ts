import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class RelianceDigitalAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'reliance-digital';
  readonly name: string = 'Reliance Digital';
  readonly logoText: string = 'Reliance Digital';
  readonly brandColor: string = '#e42529';
  readonly documentationUrl: string = 'https://www.reliancedigital.in';

  constructor() {
    super('RELIANCE_DIGITAL_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    return `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}:relevance`;
  }
}
