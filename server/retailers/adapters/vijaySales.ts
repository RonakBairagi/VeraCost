import { BaseRetailerAdapter } from '../baseAdapter';
import { RetailerId } from '../../../src/types/shopping';

export class VijaySalesAdapter extends BaseRetailerAdapter {
  readonly id: RetailerId = 'vijay-sales';
  readonly name: string = 'Vijay Sales';
  readonly logoText: string = 'Vijay Sales';
  readonly brandColor: string = '#b91c1c';
  readonly documentationUrl: string = 'https://www.vijaysales.com';

  constructor() {
    super('VIJAY_SALES_API_KEY');
  }

  buildSearchFallbackUrl(query: string): string {
    const slug = encodeURIComponent(query.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    return `https://www.vijaysales.com/search/${slug}`;
  }
}
