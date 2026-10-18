import { BaseRetailerAdapter, cleanRetailerSearchQuery } from '../baseAdapter';
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
    const clean = cleanRetailerSearchQuery(query);
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `https://www.vijaysales.com/search/${encodeURIComponent(slug)}`;
  }
}
