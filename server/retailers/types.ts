import { RetailerId, RetailerListing, RetailerIntegrationStatus } from '../../src/types/shopping';

export interface RetailerSearchQuery {
  query: string;
  brand?: string;
  model?: string;
  variant?: string;
  category?: string;
  barcode?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface RetailerAdapterResult {
  retailerId: RetailerId;
  retailerName: string;
  listings: RetailerListing[];
  isConfigured: boolean;
  statusMessage?: string;
  executionTimeMs: number;
}

export interface IRetailerAdapter {
  readonly id: RetailerId;
  readonly name: string;
  readonly logoText: string;
  readonly brandColor: string;
  readonly documentationUrl: string;
  readonly requiredEnvVar?: string;
  
  isConfigured(): boolean;
  getIntegrationStatus(): RetailerIntegrationStatus;
  buildSearchFallbackUrl(query: string): string;
  search(query: RetailerSearchQuery): Promise<RetailerAdapterResult>;
}
